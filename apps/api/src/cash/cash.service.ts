import { Injectable, NotFoundException } from '@nestjs/common';
import { CashLogType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  async charge(userId: string, amount: number) {
    const chargeAmount = BigInt(amount);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          cashBalance: true,
        },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          cashBalance: {
            increment: chargeAmount,
          },
        },
        select: {
          cashBalance: true,
        },
      });

      await tx.cashLog.create({
        data: {
          userId,
          type: CashLogType.CHARGE,
          amount: chargeAmount,
          balanceAfter: updatedUser.cashBalance,
          description: '캐시 충전',
        },
      });

      return {
        amount: chargeAmount.toString(),
        cashBalance: updatedUser.cashBalance.toString(),
      };
    });
  }
}
