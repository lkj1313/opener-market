import { IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: '상품명은 문자열이어야 합니다.' })
  @MaxLength(100, { message: '상품명은 최대 100자까지 가능합니다.' })
  name?: string;

  @IsOptional()
  @IsString({ message: '상품 설명은 문자열이어야 합니다.' })
  @MaxLength(5000, { message: '상품 설명은 최대 5000자까지 가능합니다.' })
  description?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: '가격은 소수점 없는 숫자여야 합니다.' },
  )
  @Min(0, { message: '가격은 0원 이상이어야 합니다.' })
  price?: number;

  @IsOptional()
  @IsInt({ message: '재고는 정수여야 합니다.' })
  @Min(0, { message: '재고는 0개 이상이어야 합니다.' })
  stock?: number;

  @IsOptional()
  @IsEnum(
    {
      ON_SALE: ProductStatus.ON_SALE,
      SOLD_OUT: ProductStatus.SOLD_OUT,
      HIDDEN: ProductStatus.HIDDEN,
    },
    { message: '상품 상태는 ON_SALE, SOLD_OUT, HIDDEN 중 하나여야 합니다.' },
  )
  status?: 'ON_SALE' | 'SOLD_OUT' | 'HIDDEN';
}
