import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Res,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { EnvService } from '../env/env.service';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { Types } from 'mongoose';
import { Payload, type PayloadData } from '../decorators/payload.decorator';
import {
  updateUserSchema,
  type UpdateUserDto,
  avatarSchema,
  type AvatarDto,
  savedToolsSchema,
  type SavedToolsDto,
} from './user.validation.schema';
import { type Request, type Response } from 'express';
import { ZodValidationPipe } from '../pipes/zod-validation/zod-validation.pipe';
import { FormDataRequest } from 'nestjs-form-data';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetUserDocs,
  ApiUpdateUserDocs,
  ApiUpdateUserAvatarDocs,
  ApiRemoveUserAvatarDocs,
  ApiDeleteUserDocs,
  ApiAddSavedToolsDocs,
  ApiRemoveSavedToolsDocs,
} from './user.swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly usersService: UsersService,
    private readonly envService: EnvService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User successfully retrieved')
  @ApiGetUserDocs()
  async getUser(@Payload('_id') userId: Types.ObjectId) {
    return await this.usersService.getUser(userId);
  }

  @Patch()
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User updated successfully')
  @ApiUpdateUserDocs()
  async updateUser(
    @Payload('_id') userId: Types.ObjectId,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(userId, updateUserDto);
  }

  @Patch('saved-tools')
  @UsePipes(new ZodValidationPipe(savedToolsSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Saved tools added successfully')
  @ApiAddSavedToolsDocs()
  async addSavedTools(
    @Payload('_id') userId: Types.ObjectId,
    @Body() { savedTools }: SavedToolsDto,
  ) {
    return await this.usersService.addSavedTools(userId, savedTools);
  }

  @Patch('remove-saved-tools')
  @UsePipes(new ZodValidationPipe(savedToolsSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Saved tools removed successfully')
  @ApiRemoveSavedToolsDocs()
  async removeSavedTools(
    @Payload('_id') userId: Types.ObjectId,
    @Body() { savedTools }: SavedToolsDto,
  ) {
    return await this.usersService.removeSavedTools(userId, savedTools);
  }

  @Patch('avatar')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(avatarSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Avatar updated successfully')
  @ApiUpdateUserAvatarDocs()
  async updateAvatar(
    @Req() req: Request,
    @Payload('_id') userId: Types.ObjectId,
    @Body() { avatar }: AvatarDto,
  ) {
    const protocol = req.protocol;
    const host = req.get('host');

    const avatarUrl = `${protocol}://${host}/${avatar.filename}`;

    return await this.usersService.updateUserAvatar(userId, avatarUrl);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Avatar removed successfully')
  @ApiRemoveUserAvatarDocs()
  async removeAvatar(@Payload('_id') userId: Types.ObjectId) {
    return await this.usersService.removeUserAvatar(userId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(
    'User deleted successfully, you can restore it within 90 days',
  )
  @ApiDeleteUserDocs()
  async deleteUser(
    @Res({ passthrough: true }) res: Response,
    @Payload() { _id, token, exp }: PayloadData,
  ) {
    await this.usersService.deleteUser({
      userId: _id,
      token,
      tokenExpiry: exp * 1000,
    });

    res.clearCookie(this.envService.access_token_key, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return {};
  }
}
