import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { CashController } from '../cash.controller';
import { CashService } from '../cash.service';
import { ChargeCashDto } from '../dto/charge-cash.dto';

describe('CashController', () => {
  let controller: CashController;
  let cashService: {
    charge: jest.Mock;
  };

  beforeEach(async () => {
    cashService = {
      charge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashController],
      providers: [
        {
          provide: CashService,
          useValue: cashService,
        },
      ],
    }).compile();

    controller = module.get<CashController>(CashController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the authenticated user id and amount to the service', async () => {
    const dto: ChargeCashDto = {
      amount: 10000,
    };
    const req = {
      user: {
        userId: 'user-id',
        email: 'user@example.com',
      },
    } as AuthenticatedRequest;

    cashService.charge.mockResolvedValue({
      amount: '10000',
      cashBalance: '30000',
    });

    const result = await controller.charge(dto, req);

    expect(cashService.charge).toHaveBeenCalledWith('user-id', 10000);
    expect(result).toEqual({
      amount: '10000',
      cashBalance: '30000',
    });
  });
});
