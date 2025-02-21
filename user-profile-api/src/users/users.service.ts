// users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  private readonly users: UserProfileDto[] = [
    {
      id: 1,
      name: '田中太郎',
      email: 'tanaka@example.com',
      age: 30,
      preferences: ['読書', '映画'],
    },
  ];

  findOne(
    id: number,
    fields: (keyof UserProfileDto)[],
  ): Partial<UserProfileDto> {
    const user = this.users.find((user) => user.id === id);

    if (!user) {
      throw new NotFoundException(`ID: ${id}のユーザーが見つかりません`);
    }

    if (fields.length > 0) {
      return Object.fromEntries(
        fields
          .filter((field) => field in user)
          .map((field) => [field, user[field]]),
      ) as Partial<UserProfileDto>;
    }

    return user;
  }
}
