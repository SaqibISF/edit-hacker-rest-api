import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { FormDataRequest } from 'nestjs-form-data';

import { BackupsService } from './backups.service';
import { Roles } from '../decorators/roles.decorator';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';

import {
  createBackupSchema,
  type CreateBackupDto,
  exportBackupSchema,
  type ExportBackupDto,
  restoreBackupSchema,
  type RestoreBackupDto,
  uploadBackupSchema,
  type UploadBackupDto,
  restoreUploadSchema,
  type RestoreUploadDto,
} from './backup.validation.schema';

import {
  ApiGetCollectionsDocs,
  ApiGetBackupsDocs,
  ApiCreateBackupDocs,
  ApiExportBackupDocs,
  ApiDownloadBackupDocs,
  ApiDeleteBackupDocs,
  ApiUploadBackupDocs,
  ApiRestoreBackupDocs,
  ApiRestoreUploadDocs,
} from './backup.swagger';

@ApiTags('Backups')
@Controller('backups')
@Roles(['admin'])
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get('collections')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Collections successfully retrieved')
  @ApiGetCollectionsDocs()
  async getCollections() {
    return await this.backupsService.getCollections();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Backups successfully retrieved')
  @ApiGetBackupsDocs()
  async getBackups() {
    return await this.backupsService.getBackups();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createBackupSchema))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Backup created successfully')
  @ApiCreateBackupDocs()
  async createBackup(@Body() createBackupDto: CreateBackupDto) {
    return await this.backupsService.createBackup(createBackupDto);
  }

  @Get('export')
  @UsePipes(new ZodValidationPipe(exportBackupSchema))
  @ApiExportBackupDocs()
  async exportBackup(
    @Query() exportBackupDto: ExportBackupDto,
    @Res() res: Response,
  ) {
    return await this.backupsService.exportBackupStream(exportBackupDto, res);
  }

  @Get(':filename/download')
  @ApiDownloadBackupDocs()
  async downloadBackup(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return await this.backupsService.downloadBackup(filename, res);
  }

  @Delete(':filename')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Backup file successfully deleted')
  @ApiDeleteBackupDocs()
  async deleteBackup(@Param('filename') filename: string) {
    return await this.backupsService.deleteBackup(filename);
  }

  @Post('upload')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(uploadBackupSchema))
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Backup file uploaded successfully')
  @ApiUploadBackupDocs()
  async uploadBackup(@Body() { file }: UploadBackupDto) {
    return await this.backupsService.uploadBackup(file);
  }

  @Post(':filename/restore')
  @UsePipes(new ZodValidationPipe(restoreBackupSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Database restore completed successfully')
  @ApiRestoreBackupDocs()
  async restoreBackup(
    @Param('filename') filename: string,
    @Body() restoreBackupDto: RestoreBackupDto,
  ) {
    return await this.backupsService.restoreBackup(filename, restoreBackupDto);
  }

  @Post('restore-upload')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(restoreUploadSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Database restore completed successfully')
  @ApiRestoreUploadDocs()
  async restoreUpload(@Body() { file, mode, collections }: RestoreUploadDto) {
    return await this.backupsService.restoreFromUploadedFile(file, {
      mode,
      collections,
    });
  }
}
