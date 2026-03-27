import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ChargeCashDto {
  @Type(() => Number)
  @IsInt({ message: '충전 금액은 정수여야 합니다.' })
  @Min(1, { message: '충전 금액은 1원 이상이어야 합니다.' })
  @Max(1000000, { message: '1회 충전 금액은 최대 100만원까지 가능합니다.' })
  amount!: number;
}
