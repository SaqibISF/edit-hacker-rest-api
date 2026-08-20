import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { Roles } from '../decorators/roles.decorator';
import { Types } from 'mongoose';
import { MongooseIdPipe } from '../pipes/mongoose-id/mongoose-id.pipe';
import {
  usersQuerySchema,
  type UsersQueryDto,
  updateUserByAdminSchema,
  type UpdateUserByAdminDto,
} from './user.validation.schema';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import { IdentifierPipe } from '../pipes/identifier/identifier.pipe';
import {
  ApiGetUsersDocs,
  ApiGetUserByAdminDocs,
  ApiUpdateUserByAdminDocs,
  ApiRestoreUserByAdminDocs,
  ApiDeleteUserByAdminDocs,
  ApiPermanentDeleteUserByAdminDocs,
} from './users.swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(['admin'])
  @Get()
  @UsePipes(new ZodValidationPipe(usersQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Users successfully retrieved')
  @ApiGetUsersDocs()
  async getUsers(@Query() query: UsersQueryDto) {
    return await this.usersService.getUsers(query);
  }

  @Roles(['admin'])
  @Get(':identifier')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User successfully retrieved')
  @ApiGetUserByAdminDocs()
  async getUserByAdmin(
    @Param('identifier', IdentifierPipe) userId: string | Types.ObjectId,
  ) {
    return await this.usersService.getUser(userId);
  }

  @Roles(['admin'])
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateUserByAdminSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User updated successfully')
  @ApiUpdateUserByAdminDocs()
  async updateUserByAdmin(
    @Param('id', MongooseIdPipe) userId: Types.ObjectId,
    @Body()
    updateUserByAdminDto: UpdateUserByAdminDto,
  ) {
    return await this.usersService.updateUserByAdmin(
      userId,
      updateUserByAdminDto,
    );
  }

  @Roles(['admin'])
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User restored successfully')
  @ApiRestoreUserByAdminDocs()
  async restoreUserByAdmin(
    @Param('id', MongooseIdPipe) userId: Types.ObjectId,
  ) {
    return await this.usersService.restoreUser(userId);
  }

  @Roles(['admin'])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(
    'User deleted successfully, the user can restore it within 90 days',
  )
  @ApiDeleteUserByAdminDocs()
  async deleteUserByAdmin(@Param('id', MongooseIdPipe) userId: Types.ObjectId) {
    await this.usersService.deleteUser({ userId });
    return {};
  }

  @Roles(['admin'])
  @Delete(':id/permanent-delete')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User permanently deleted successfully')
  @ApiPermanentDeleteUserByAdminDocs()
  async permanentDeleteUserByAdmin(
    @Param('id', MongooseIdPipe) userId: Types.ObjectId,
  ) {
    await this.usersService.permanentDeleteUser(userId);
    return {};
  }
}
