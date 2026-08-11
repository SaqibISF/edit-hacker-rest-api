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
import { UserRole } from './user.schema';
import { Roles } from '../decorators/roles.decorator';
import { Types } from 'mongoose';
import { MongooseIdPipe } from '../pipes/mongoose-id/mongoose-id.pipe';
import {
  updateUserByAdminSchema,
  type UpdateUserByAdminDto,
} from '../zod-schemas/update-user-by-admin.schema';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import { IdentifierPipe } from '../pipes/identifier/identifier.pipe';
import {
  usersQuerySchema,
  type UsersQueryDto,
} from '../zod-schemas/users-query.schema';
import {
  ApiGetUsers,
  ApiGetUserByAdmin,
  ApiUpdateUserByAdmin,
  ApiRestoreUserByAdmin,
  ApiDeleteUserByAdmin,
  ApiPermanentDeleteUserByAdmin,
} from './users.decorators';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiGetUsers()
  @Roles([UserRole.ADMIN])
  @Get()
  @UsePipes(new ZodValidationPipe(usersQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Users successfully retrieved')
  async getUsers(@Query() query: UsersQueryDto) {
    return await this.usersService.getUsers(query);
  }

  @ApiGetUserByAdmin()
  @Roles([UserRole.ADMIN])
  @Get(':identifier')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User successfully retrieved')
  async getUserByAdmin(
    @Param('identifier', IdentifierPipe) userId: string | Types.ObjectId,
  ) {
    return await this.usersService.getUser(userId);
  }

  @ApiUpdateUserByAdmin()
  @Roles([UserRole.ADMIN])
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateUserByAdminSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User updated successfully')
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

  @ApiRestoreUserByAdmin()
  @Roles([UserRole.ADMIN])
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User restored successfully')
  async restoreUserByAdmin(
    @Param('id', MongooseIdPipe) userId: Types.ObjectId,
  ) {
    return await this.usersService.restoreUser(userId);
  }

  @ApiDeleteUserByAdmin()
  @Roles([UserRole.ADMIN])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(
    'User deleted successfully, the user can restore it within 90 days',
  )
  async deleteUserByAdmin(@Param('id', MongooseIdPipe) userId: Types.ObjectId) {
    await this.usersService.deleteUser({ userId });
    return {};
  }

  @ApiPermanentDeleteUserByAdmin()
  @Roles([UserRole.ADMIN])
  @Delete(':id/permanent-delete')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User permanently deleted successfully')
  async permanentDeleteUserByAdmin(
    @Param('id', MongooseIdPipe) userId: Types.ObjectId,
  ) {
    await this.usersService.permanentDeleteUser(userId);
    return {};
  }
}
