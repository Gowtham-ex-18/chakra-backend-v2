import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '../../common/interfaces/user.interface';
import { UserRepository } from '../../database/repository/user.repository';
import { hashPassword } from '../../database/schema/user.schema';
import { CreateUser } from './dto/create-user.dto';
import { UpdateUser } from './dto/update-user.dto';
import { toUserResponse, UserResponse } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(): Promise<UserResponse[]> {
    const users = await this.userRepository.findAll();
    return users.map(toUserResponse);
  }

  async findOne(userId: string): Promise<UserResponse> {
    return toUserResponse(await this.getUserOrThrow(userId));
  }

  async create(dto: CreateUser): Promise<UserResponse> {
    await this.ensureEmailIsFree(dto.email);

    const user = await this.userRepository.create({
      ...dto,
      password: await hashPassword(dto.password),
    });
    return toUserResponse(user);
  }

  async update(userId: string, dto: UpdateUser): Promise<UserResponse> {
    const existing = await this.getUserOrThrow(userId);

    if (dto.email && dto.email !== existing.email) {
      await this.ensureEmailIsFree(dto.email);
    }

    const user = await this.userRepository.update(userId, {
      ...dto,
      ...(dto.password && {
        password: await hashPassword(dto.password),
      }),
    });
    if (!user) throw new NotFoundException('User not found');
    return toUserResponse(user);
  }

  async remove(userId: string): Promise<void> {
    const deleted = await this.userRepository.delete(userId);
    if (!deleted) throw new NotFoundException('User not found');
  }

  private async getUserOrThrow(userId: string): Promise<User> {
    const user = await this.userRepository.findByUserId(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async ensureEmailIsFree(email: string): Promise<void> {
    if (await this.userRepository.findByEmail(email)) {
      throw new ConflictException('Email is already registered');
    }
  }
}
