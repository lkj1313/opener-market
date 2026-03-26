import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    getMe: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      getMe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('컨트롤러가 정의되어 있어야 한다', () => {
    expect(controller).toBeDefined();
  });

  it('현재 로그인한 사용자 id로 내 정보 조회를 요청해야 한다', async () => {
    const req = {
      user: {
        userId: 'user-id',
        email: 'test@example.com',
      },
    } as Request & {
      user: {
        userId: string;
        email: string;
      };
    };

    usersService.getMe.mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      nickname: 'tester',
    });

    const result = await controller.getMe(req);

    expect(usersService.getMe).toHaveBeenCalledWith('user-id');
    expect(result).toEqual({
      id: 'user-id',
      email: 'test@example.com',
      nickname: 'tester',
    });
  });
});
