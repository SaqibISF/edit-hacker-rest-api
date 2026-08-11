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
} from '../zod-schemas/update-user.schema';
import { type Request, type Response } from 'express';
import { ZodValidationPipe } from 'src/pipes/zod-validation/zod-validation.pipe';
import { FormDataRequest } from 'nestjs-form-data';
import { avatarSchema, type AvatarDto } from 'src/zod-schemas/avatar.schema';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetUser,
  ApiUpdateUser,
  ApiUpdateUserAvatar,
  ApiRemoveUserAvatar,
  ApiDeleteUser,
} from './user.decorators';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly usersService: UsersService,
    private readonly envService: EnvService,
  ) {}

  @ApiGetUser()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User successfully retrieved')
  async getUser(@Payload('_id') userId: Types.ObjectId) {
    return await this.usersService.getUser(userId);
  }

  @ApiUpdateUser()
  @Patch()
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User updated successfully')
  async updateUser(
    @Payload('_id') userId: Types.ObjectId,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(userId, updateUserDto);
  }

  @ApiUpdateUserAvatar()
  @Patch('avatar')
  @FormDataRequest()
  @UsePipes(new ZodValidationPipe(avatarSchema))
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Avatar updated successfully')
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

  @ApiRemoveUserAvatar()
  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Avatar removed successfully')
  async removeAvatar(@Payload('_id') userId: Types.ObjectId) {
    return await this.usersService.removeUserAvatar(userId);
  }

  @ApiDeleteUser()
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(
    'User deleted successfully, you can restore it within 90 days',
  )
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
