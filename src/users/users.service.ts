import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, UserDocument } from './user.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  _QueryFilterLooseId,
  Connection,
  Model,
  PaginateOptions,
  PrePaginatePipelineStage,
  Types,
  type AggregatePaginateModel,
  type UpdateQuery,
} from 'mongoose';
import {
  RevokedToken,
  RevokedTokenDocument,
} from '../auth/revoked-tokens.schema';
import { UpdateUserByAdminDto } from '../zod-schemas/update-user-by-admin.schema';
import { UpdateUserDto } from '../zod-schemas/update-user.schema';
import { UsersQueryDto } from '../zod-schemas/users-query.schema';
import fs from 'fs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: AggregatePaginateModel<UserDocument>,

    @InjectModel(RevokedToken.name)
    private readonly revokedTokenModel: Model<RevokedTokenDocument>,

    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getUsers({
    page,
    limit,
    search,
    sortBy,
    sortOrder = 'DESC',
    role,
    status,
    verified,
    deleted,
    dateFrom,
    dateTo,
  }: UsersQueryDto) {
    const aggregate: PrePaginatePipelineStage[] = [];
    const match: _QueryFilterLooseId<UserDocument> = {};

    if (search) match.$text = { $search: search };

    if (role) match.role = role;

    if (status) match.bannedAt = { $exists: status === 'banned' };

    if (verified) match.emailVerifiedAt = { $exists: verified === 'yes' };

    if (deleted !== 'with') match.deletedAt = { $exists: deleted === 'only' };

    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) match.createdAt.$lte = new Date(dateTo);
    }

    if (Object.keys(match).length > 0) aggregate.push({ $match: match });

    aggregate.push({ $sort: { [sortBy]: sortOrder === 'DESC' ? -1 : 1 } });

    aggregate.push({ $project: { password: 0 } });

    const options: PaginateOptions = {
      page,
      limit,
      customLabels: {
        docs: 'users',
        totalDocs: 'totalUsers',
        pagingCounter: 'pageStart',
      },
    };

    const [{ users, ...meta }, [stats]] = await Promise.all([
      this.userModel.aggregatePaginate(aggregate, options),
      this.userModel.aggregate([
        { $match: match },

        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: null,
                  activeUsers: {
                    $sum: {
                      $cond: [
                        { $eq: [{ $type: '$bannedAt' }, 'missing'] },
                        1,
                        0,
                      ],
                    },
                  },

                  bannedUsers: {
                    $sum: {
                      $cond: [
                        { $ne: [{ $type: '$bannedAt' }, 'missing'] },
                        1,
                        0,
                      ],
                    },
                  },

                  todayRegisteredUsers: {
                    $sum: {
                      $cond: [
                        {
                          $gte: [
                            '$createdAt',
                            new Date(new Date().setHours(0, 0, 0, 0)),
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },

              { $project: { _id: 0 } },
            ],
          },
        },

        {
          $project: {
            stats: {
              $ifNull: [
                { $arrayElemAt: ['$stats', 0] },
                { activeUsers: 0, bannedUsers: 0, todayRegisteredUsers: 0 },
              ],
            },
          },
        },

        { $replaceRoot: { newRoot: '$stats' } },
      ]) as Promise<{ [key: string]: unknown }[]>,
    ]);

    return { users, meta: { ...meta, ...stats } };
  }

  async getUser(identifier: string | Types.ObjectId) {
    const user = await this.userModel
      .findOne(
        typeof identifier === 'string'
          ? { slug: identifier }
          : { _id: identifier },
      )
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    return { user };
  }

  async updateUser(userId: Types.ObjectId, updateUserDto: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, updateUserDto, { returnDocument: 'after' })
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    return { user };
  }

  async updateUserAvatar(userId: Types.ObjectId, avatarUrl: string) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { avatarUrl }, { returnDocument: 'before' })
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    if (user.avatarUrl) {
      const filePath = `public\\uploads\\${new URL(user.avatarUrl).pathname}`;

      void fs.promises.unlink(filePath).catch((err: NodeJS.ErrnoException) => {
        if (err.code !== 'ENOENT') {
          console.error(`Failed to delete file at ${filePath}:`, err);
        }
      });
    }

    user.avatarUrl = avatarUrl;

    return { user };
  }

  async removeUserAvatar(userId: Types.ObjectId) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $unset: { avatarUrl: 1 } },
        { returnDocument: 'before' },
      )
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    if (!user.avatarUrl) {
      throw new NotFoundException('Avatar is not found');
    }

    const filePath = `public\\uploads\\${new URL(user.avatarUrl).pathname}`;

    void fs.promises.unlink(filePath).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete file at ${filePath}:`, err);
      }
    });

    delete user.avatarUrl;

    return { user };
  }

  async updateUserByAdmin(
    userId: Types.ObjectId,
    { emailVerified, banned, banReason, ...payload }: UpdateUserByAdminDto,
  ) {
    const now = new Date();

    const update: UpdateQuery<UserDocument> = {};
    const setQuery: Record<string, any> = { ...payload };

    if (emailVerified) {
      setQuery.emailVerifiedAt = now;
    }

    if (typeof banned === 'boolean') {
      if (banned) {
        setQuery.bannedAt = now;
        setQuery.banReason = banReason;
      } else {
        update.$unset = { bannedAt: 1, banReason: 1 };
      }
    }

    if (Object.keys(setQuery).length > 0) {
      update.$set = setQuery;
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, update, {
        returnDocument: 'after',
      })
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    return { user };
  }

  async deleteUser({
    userId,
    token,
    tokenExpiry,
  }: {
    userId: Types.ObjectId;
    token?: string;
    tokenExpiry?: number;
  }) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const deletedAt = new Date();

      const user = await this.userModel
        .findByIdAndUpdate(
          userId,
          { deletedAt },
          { returnDocument: 'before', session },
        )
        .select('deletedAt -_id')
        .lean()
        .exec();

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.deletedAt) {
        throw new ConflictException('User already deleted');
      }

      if (token && tokenExpiry) {
        await this.revokedTokenModel.create(
          [{ token, expireAt: tokenExpiry }],
          { session },
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async restoreUser(userId: Types.ObjectId) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $unset: { deletedAt: 1 } },
        { returnDocument: 'before' },
      )
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new ConflictException('This user was not deleted');
    }

    delete user.deletedAt;

    return { user };
  }

  async permanentDeleteUser(userId: Types.ObjectId) {
    const user = await this.userModel
      .findByIdAndDelete(userId, { returnDocument: 'before' })
      .select('_id')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
