import { Controller, Get, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMe(req.user.userId);
  }
}
