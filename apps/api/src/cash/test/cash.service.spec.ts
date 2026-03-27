import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CashLogType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CashService } from '../cash.service';

describe('CashService', () => {
  let service: CashService;
  let prismaService: {
    $transaction: jest.Mock;
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    cashLog: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      cashLog: {
        create: jest.fn(),
      },
    };

    prismaService.$transaction.mockImplementation(async (callback) =>
      callback(prismaService),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<CashService>(CashService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('charges cash and creates a cash log in a transaction', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-id',
      cashBalance: BigInt(20000),
    });
    prismaService.user.update.mockResolvedValue({
      cashBalance: BigInt(30000),
    });
    prismaService.cashLog.create.mockResolvedValue({
      id: 'log-id',
    });

    const result = await service.charge('user-id', 10000);

    expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      select: {
        id: true,
        cashBalance: true,
      },
    });
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        cashBalance: {
          increment: BigInt(10000),
        },
      },
      select: {
        cashBalance: true,
      },
    });
    expect(prismaService.cashLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-id',
        type: CashLogType.CHARGE,
        amount: BigInt(10000),
        balanceAfter: BigInt(30000),
        description: '캐시 충전',
      },
    });
    expect(result).toEqual({
      amount: '10000',
      cashBalance: '30000',
    });
  });

  it('throws when charging a missing user', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.charge('missing-user-id', 10000)).rejects.toEqual(
      new NotFoundException('사용자를 찾을 수 없습니다.'),
    );
    expect(prismaService.user.update).not.toHaveBeenCalled();
    expect(prismaService.cashLog.create).not.toHaveBeenCalled();
  });
});
