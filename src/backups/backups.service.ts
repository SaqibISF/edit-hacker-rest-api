import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { type Response } from 'express';
import { CustomFileSystemStoredFile } from '../form-data-config/form-data-config.module';
import {
  CreateBackupDto,
  ExportBackupDto,
  RestoreBackupDto,
  RestoreMode,
} from './backup.validation.schema';

export interface BackupCollectionInfo {
  name: string;
  documentCount: number;
}

export interface StoredBackupInfo {
  filename: string;
  size: number;
  sizeFormatted: string;
  createdAt: Date;
  isCompressed: boolean;
  collections?: string[];
  totalDocuments?: number;
}

export interface BackupFileContent {
  version: string;
  createdAt: string;
  database?: string;
  totalCollections: number;
  totalDocuments: number;
  collections: Record<string, unknown[]>;
}

@Injectable()
export class BackupsService {
  private readonly backupDir = path.resolve(process.cwd(), '.backups');

  constructor(@InjectConnection() private readonly connection: Connection) {
    void this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await fs.promises.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  private serializeDoc(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Types.ObjectId) {
      return { $oid: obj.toHexString() };
    }
    if (
      typeof obj === 'object' &&
      obj !== null &&
      '_bsontype' in obj &&
      (obj as { _bsontype: string })._bsontype === 'ObjectID' &&
      'toHexString' in obj &&
      typeof (obj as { toHexString: () => string }).toHexString === 'function'
    ) {
      return { $oid: (obj as { toHexString: () => string }).toHexString() };
    }
    if (obj instanceof Date) {
      return { $date: obj.toISOString() };
    }
    if (Array.isArray(obj)) {
      return obj.map((item: unknown) => this.serializeDoc(item));
    }
    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
        result[key] = this.serializeDoc(val);
      }
      return result;
    }
    return obj;
  }

  private deserializeDoc(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'object') {
      const record = obj as Record<string, unknown>;
      if (typeof record.$oid === 'string') {
        try {
          return new Types.ObjectId(record.$oid);
        } catch {
          return record.$oid;
        }
      }
      if (typeof record.$date === 'string') {
        const d = new Date(record.$date);
        if (!isNaN(d.getTime())) return d;
      }
      if (Array.isArray(obj)) {
        return obj.map((item: unknown) => this.deserializeDoc(item));
      }
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(record)) {
        if (
          key === '_id' &&
          typeof val === 'string' &&
          /^[0-9a-fA-F]{24}$/.test(val)
        ) {
          try {
            result[key] = new Types.ObjectId(val);
          } catch {
            result[key] = val;
          }
        } else {
          result[key] = this.deserializeDoc(val);
        }
      }
      return result;
    }
    return obj;
  }

  private async getAvailableCollectionNames(): Promise<string[]> {
    const db = this.connection.db;
    if (!db) throw new InternalServerErrorException('Database not connected');
    const collections = await db.listCollections().toArray();
    return collections
      .map((c) => c.name)
      .filter((name) => !name.startsWith('system.'));
  }

  async getCollections(): Promise<{ collections: BackupCollectionInfo[] }> {
    const db = this.connection.db;
    if (!db) throw new InternalServerErrorException('Database not connected');

    const collectionNames = await this.getAvailableCollectionNames();
    const result: BackupCollectionInfo[] = [];

    for (const name of collectionNames) {
      try {
        const coll = db.collection(name);
        const count = await coll.countDocuments();
        result.push({ name, documentCount: count });
      } catch {
        result.push({ name, documentCount: 0 });
      }
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    return { collections: result };
  }

  private async generateBackupData(
    requestedCollections?: string[],
  ): Promise<BackupFileContent> {
    const db = this.connection.db;
    if (!db) throw new InternalServerErrorException('Database not connected');

    const available = await this.getAvailableCollectionNames();
    let targetCollections = available;

    if (requestedCollections && requestedCollections.length > 0) {
      const invalid = requestedCollections.filter(
        (c) => !available.includes(c),
      );
      if (invalid.length > 0) {
        throw new BadRequestException(
          `The following collections do not exist: ${invalid.join(', ')}`,
        );
      }
      targetCollections = requestedCollections;
    }

    const backupCollectionsData: Record<string, unknown[]> = {};
    let totalDocuments = 0;

    for (const name of targetCollections) {
      const coll = db.collection(name);
      const rawDocs = await coll.find({}).toArray();
      const serializedDocs: unknown[] = rawDocs.map((doc) =>
        this.serializeDoc(doc),
      );
      backupCollectionsData[name] = serializedDocs;
      totalDocuments += serializedDocs.length;
    }

    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      database: db.databaseName,
      totalCollections: targetCollections.length,
      totalDocuments,
      collections: backupCollectionsData,
    };
  }

  async createBackup({
    collections,
    name,
    compress = false,
  }: CreateBackupDto): Promise<{ backup: StoredBackupInfo }> {
    await this.ensureBackupDirectory();
    const backupData = await this.generateBackupData(collections);

    const dateStr = new Date()
      .toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .replace(/\..+/, '');

    const prefix = name ? `${name}-` : 'full-';
    const filename = `backup-${prefix}${dateStr}.json${compress ? '.gz' : ''}`;
    const filePath = path.join(this.backupDir, filename);

    const jsonString = JSON.stringify(backupData, null, 2);

    if (compress) {
      const compressedBuffer = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
      await fs.promises.writeFile(filePath, compressedBuffer);
    } else {
      await fs.promises.writeFile(filePath, jsonString, 'utf-8');
    }

    const stats = await fs.promises.stat(filePath);

    return {
      backup: {
        filename,
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        createdAt: stats.birthtime || stats.mtime,
        isCompressed: compress,
        collections: Object.keys(backupData.collections),
        totalDocuments: backupData.totalDocuments,
      },
    };
  }

  async exportBackupStream(
    { collections, compress }: ExportBackupDto,
    res: Response,
  ) {
    const isCompressed = Boolean(compress);
    const backupData = await this.generateBackupData(collections);

    const dateStr = new Date()
      .toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .replace(/\..+/, '');

    const filename = `backup-export-${dateStr}.json${isCompressed ? '.gz' : ''}`;
    const jsonString = JSON.stringify(backupData, null, 2);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (isCompressed) {
      res.setHeader('Content-Type', 'application/gzip');
      const compressedBuffer = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
      res.send(compressedBuffer);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(jsonString);
    }
  }

  async getBackups(): Promise<{ backups: StoredBackupInfo[] }> {
    await this.ensureBackupDirectory();
    const files = await fs.promises.readdir(this.backupDir);
    const backups: StoredBackupInfo[] = [];

    for (const filename of files) {
      if (!filename.endsWith('.json') && !filename.endsWith('.json.gz')) {
        continue;
      }

      try {
        const filePath = path.join(this.backupDir, filename);
        const stats = await fs.promises.stat(filePath);
        const isCompressed = filename.endsWith('.gz');

        let collections: string[] | undefined;
        let totalDocuments: number | undefined;

        // Try reading small/medium metadata if uncompressed and under 2MB
        if (!isCompressed && stats.size < 2 * 1024 * 1024) {
          try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(
              content,
            ) as unknown as Partial<BackupFileContent>;
            if (parsed.collections && typeof parsed.collections === 'object') {
              collections = Object.keys(parsed.collections);
              totalDocuments = parsed.totalDocuments;
            }
          } catch (readErr) {
            void readErr;
          }
        }

        backups.push({
          filename,
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          createdAt: stats.birthtime || stats.mtime,
          isCompressed,
          collections,
          totalDocuments,
        });
      } catch (fileErr) {
        void fileErr;
      }
    }

    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { backups };
  }

  getBackupFilePath(filename: string): string {
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new BadRequestException('Invalid backup filename');
    }

    const filePath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup file "${filename}" not found`);
    }

    return filePath;
  }

  async downloadBackup(filename: string, res: Response): Promise<void> {
    const filePath = this.getBackupFilePath(filename);
    const isCompressed = filename.endsWith('.gz');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader(
      'Content-Type',
      isCompressed ? 'application/gzip' : 'application/json',
    );

    await new Promise<void>((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  }

  async deleteBackup(
    filename: string,
  ): Promise<{ success: boolean; message: string }> {
    const filePath = this.getBackupFilePath(filename);
    await fs.promises.unlink(filePath);
    return {
      success: true,
      message: `Backup file "${filename}" successfully deleted`,
    };
  }

  async uploadBackup(
    file: CustomFileSystemStoredFile,
  ): Promise<{ backup: StoredBackupInfo }> {
    await this.ensureBackupDirectory();

    let contentString = '';
    const isCompressed =
      file.originalName.endsWith('.gz') ||
      file.mimetype === 'application/gzip' ||
      file.mimetype === 'application/x-gzip';

    try {
      const fileBuffer = await fs.promises.readFile(file.path);
      if (isCompressed) {
        contentString = zlib.gunzipSync(fileBuffer).toString('utf-8');
      } else {
        contentString = fileBuffer.toString('utf-8');
      }

      const parsed = JSON.parse(
        contentString,
      ) as unknown as Partial<BackupFileContent>;
      if (!parsed.collections || typeof parsed.collections !== 'object') {
        throw new Error('Missing collections object');
      }
    } catch (err: unknown) {
      // Clean temp file
      try {
        await fs.promises.unlink(file.path);
      } catch (unlinkErr) {
        void unlinkErr;
      }
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Must be valid JSON containing collections';
      throw new BadRequestException(
        `Invalid backup file format: ${errorMessage}`,
      );
    }

    const dateStr = new Date()
      .toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .replace(/\..+/, '');

    const cleanOriginalName = path
      .parse(file.originalName)
      .name.replace(/[^a-zA-Z0-9_-]/g, '_');

    const destFilename = `uploaded-${cleanOriginalName}-${dateStr}${isCompressed ? '.json.gz' : '.json'}`;
    const destPath = path.join(this.backupDir, destFilename);

    await fs.promises.copyFile(file.path, destPath);

    try {
      await fs.promises.unlink(file.path);
    } catch (unlinkErr) {
      void unlinkErr;
    }

    const stats = await fs.promises.stat(destPath);

    return {
      backup: {
        filename: destFilename,
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        createdAt: stats.birthtime || stats.mtime,
        isCompressed,
      },
    };
  }

  private parseBackupFileContent(
    buffer: Buffer,
    isCompressed: boolean,
  ): BackupFileContent {
    let jsonString = '';
    try {
      if (isCompressed) {
        jsonString = zlib.gunzipSync(buffer).toString('utf-8');
      } else {
        jsonString = buffer.toString('utf-8');
      }
      const data = JSON.parse(jsonString) as unknown as BackupFileContent;
      if (!data.collections || typeof data.collections !== 'object') {
        throw new Error('Backup data does not contain a "collections" map');
      }
      return data;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Invalid JSON format';
      throw new BadRequestException(
        `Failed to parse backup content: ${errorMessage}`,
      );
    }
  }

  private async executeRestore(
    backupData: BackupFileContent,
    mode: RestoreMode = 'replace',
    filterCollections?: string[],
  ): Promise<{
    mode: RestoreMode;
    restoredCollections: Array<{
      collection: string;
      documentsRestored: number;
    }>;
    totalDocumentsRestored: number;
  }> {
    const db = this.connection.db;
    if (!db) throw new InternalServerErrorException('Database not connected');

    const availableCollectionsInBackup = Object.keys(backupData.collections);
    let targetCollections = availableCollectionsInBackup;

    if (filterCollections && filterCollections.length > 0) {
      targetCollections = filterCollections.filter((c) =>
        availableCollectionsInBackup.includes(c),
      );
      if (targetCollections.length === 0) {
        throw new BadRequestException(
          'None of the requested collections exist in this backup file.',
        );
      }
    }

    const restoredCollections: Array<{
      collection: string;
      documentsRestored: number;
    }> = [];
    let totalDocumentsRestored = 0;

    for (const collName of targetCollections) {
      const rawDocs = backupData.collections[collName] || [];
      const deserializedDocs = rawDocs.map((d) => this.deserializeDoc(d));
      const coll = db.collection(collName);

      if (mode === 'replace') {
        // Clean existing records in this collection
        await coll.deleteMany({});
        if (deserializedDocs.length > 0) {
          const CHUNK_SIZE = 500;
          for (let i = 0; i < deserializedDocs.length; i += CHUNK_SIZE) {
            const chunk = deserializedDocs.slice(i, i + CHUNK_SIZE);
            await coll.insertMany(chunk as Record<string, unknown>[], {
              ordered: false,
            });
          }
        }
      } else {
        // Merge / upsert mode
        if (deserializedDocs.length > 0) {
          const CHUNK_SIZE = 500;
          for (let i = 0; i < deserializedDocs.length; i += CHUNK_SIZE) {
            const chunk = deserializedDocs.slice(i, i + CHUNK_SIZE);
            const operations = chunk.map((doc) => {
              const docRecord = doc as Record<string, unknown>;
              return {
                replaceOne: {
                  filter: { _id: docRecord._id },
                  replacement: docRecord,
                  upsert: true,
                },
              };
            });
            await coll.bulkWrite(
              operations as unknown as Parameters<typeof coll.bulkWrite>[0],
              { ordered: false },
            );
          }
        }
      }

      restoredCollections.push({
        collection: collName,
        documentsRestored: deserializedDocs.length,
      });
      totalDocumentsRestored += deserializedDocs.length;
    }

    return {
      mode,
      restoredCollections,
      totalDocumentsRestored,
    };
  }

  async restoreBackup(
    filename: string,
    { mode = 'replace', collections }: RestoreBackupDto,
  ) {
    const filePath = this.getBackupFilePath(filename);
    const isCompressed = filename.endsWith('.gz');
    const buffer = await fs.promises.readFile(filePath);

    const backupData = this.parseBackupFileContent(buffer, isCompressed);
    const restoreResult = await this.executeRestore(
      backupData,
      mode,
      collections,
    );

    return {
      success: true,
      message: `Database successfully restored from "${filename}"`,
      ...restoreResult,
    };
  }

  async restoreFromUploadedFile(
    file: CustomFileSystemStoredFile,
    { mode = 'replace', collections }: RestoreBackupDto,
  ) {
    const isCompressed =
      file.originalName.endsWith('.gz') ||
      file.mimetype === 'application/gzip' ||
      file.mimetype === 'application/x-gzip';

    try {
      const buffer = await fs.promises.readFile(file.path);
      const backupData = this.parseBackupFileContent(buffer, isCompressed);
      const restoreResult = await this.executeRestore(
        backupData,
        mode,
        collections,
      );

      return {
        success: true,
        message: 'Database successfully restored from uploaded backup file',
        ...restoreResult,
      };
    } finally {
      try {
        await fs.promises.unlink(file.path);
      } catch (unlinkErr) {
        void unlinkErr;
      }
    }
  }
}
