import { BadRequestException, Global, Module } from '@nestjs/common';
import {
  FileSystemStoredFile,
  NestjsFormDataModule,
  FormDataInterceptorConfig,
} from 'nestjs-form-data';
import fs from 'fs';
import path from 'path';
import { ParticleStoredFile } from 'nestjs-form-data/dist/interfaces/ParticleStoredFile';
import { Readable as ReadableStream } from 'stream';

export class CustomFileSystemStoredFile extends FileSystemStoredFile {
  filename!: string;

  static async create(
    busboyFileMeta: ParticleStoredFile,
    stream: ReadableStream,
    config: FormDataInterceptorConfig,
  ): Promise<CustomFileSystemStoredFile> {
    if (!config.fileSystemStoragePath) {
      throw new BadRequestException('fileSystemStoragePath is required');
    }

    // Ensure the upload directory exists
    await fs.promises.mkdir(config.fileSystemStoragePath, { recursive: true });

    // Generate a unique suffix and construct the filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const parsed = path.parse(busboyFileMeta.originalName);
    const filename = `${parsed.name.toLowerCase().replaceAll(' ', '-')}-${uniqueSuffix}${parsed.ext}`;

    const filePath = path.resolve(config.fileSystemStoragePath, filename);

    return new Promise((res, rej) => {
      const outStream = fs.createWriteStream(filePath);
      let size = 0;
      stream.on('data', (chunk: Buffer) => (size += chunk.length));
      stream.on('error', rej);
      outStream.on('error', rej);
      outStream.on('finish', () => {
        const file = new CustomFileSystemStoredFile();
        file.originalName = busboyFileMeta.originalName;
        file.encoding = busboyFileMeta.encoding;
        file.busBoyMimeType = busboyFileMeta.mimetype;
        file.path = filePath;
        file.size = size;
        file.filename = filename;
        res(file);
      });
      stream.pipe(outStream);
    });
  }
}

@Global()
@Module({
  imports: [
    NestjsFormDataModule.config({
      storage: CustomFileSystemStoredFile,
      fileSystemStoragePath: './public/uploads',
      cleanupAfterSuccessHandle: false,
      cleanupAfterFailedHandle: false,
    }),
  ],
  exports: [NestjsFormDataModule],
})
export class FormDataConfigModule {}
