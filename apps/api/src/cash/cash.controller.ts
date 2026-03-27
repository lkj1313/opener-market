import { Body, Controller, Post, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';
import { CashService } from './cash.service';
import { ChargeCashDto } from './dto/charge-cash.dto';

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Post('charge')
  charge(
    @Body() chargeCashDto: ChargeCashDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cashService.charge(req.user.userId, chargeCashDto.amount);
  }
}
