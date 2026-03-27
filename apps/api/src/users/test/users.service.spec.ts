import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('서비스가 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  it('내 정보 조회 시 공개 가능한 사용자 정보만 반환해야 한다', async () => {
    const user = {
      id: 'user-id',
      email: 'test@example.com',
      nickname: 'tester',
      status: 'ACTIVE',
      cashBalance: BigInt(0),
      pointBalance: BigInt(1000),
      createdAt: new Date('2026-03-24T00:00:00.000Z'),
      updatedAt: new Date('2026-03-25T00:00:00.000Z'),
    };

    prismaService.user.findUnique.mockResolvedValue(user);

    const result = await service.getMe('user-id');

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      select: {
        id: true,
        email: true,
        nickname: true,
        status: true,
        cashBalance: true,
        pointBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toEqual({
      ...user,
      cashBalance: '0',
      pointBalance: '1000',
    });
  });

  it('사용자가 없으면 NotFoundException을 던져야 한다', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.getMe('missing-user-id')).rejects.toEqual(
      new NotFoundException('사용자를 찾을 수 없습니다.'),
    );
  });
});
