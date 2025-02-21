// users.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Header,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserProfileDto } from './dto/user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/profile')
  @Header('Cache-Control', 'max-age=60')
  getProfile(
    @Param('id', ParseIntPipe) id: number,
    @Query('fields') fields?: string,
  ): Partial<UserProfileDto> {
    // keyof UserProfileDto として安全な型変換を行う
    const fieldArray = fields
      ? (fields.split(',') as (keyof UserProfileDto)[]).filter(
          (field): field is keyof UserProfileDto => {
            const validFields = new Set([
              'id',
              'name',
              'email',
              'age',
              'preferences',
            ]);
            return validFields.has(field);
          },
        )
      : [];

    return this.usersService.findOne(id, fieldArray);
  }
}
