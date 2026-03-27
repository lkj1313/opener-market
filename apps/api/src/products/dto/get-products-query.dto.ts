import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GetProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '페이지는 정수여야 합니다.' })
  @Min(1, { message: '페이지는 1 이상이어야 합니다.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => String)
  @IsString({ message: '검색어는 문자열이어야 합니다.' })
  @MaxLength(100, { message: '검색어는 최대 100자까지 입력할 수 있습니다.' })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit은 정수여야 합니다.' })
  @Min(1, { message: 'limit은 1 이상이어야 합니다.' })
  @Max(100, { message: 'limit은 최대 100까지 가능합니다.' })
  limit?: number = 20;

  @IsOptional()
  @IsIn(['latest', 'priceAsc', 'priceDesc'], {
    message: '정렬 기준은 latest, priceAsc, priceDesc 중 하나여야 합니다.',
  })
  sort?: 'latest' | 'priceAsc' | 'priceDesc' = 'latest';

  @IsOptional()
  @IsIn(['all', 'onSale', 'soldOut'], {
    message: '상태 필터는 all, onSale, soldOut 중 하나여야 합니다.',
  })
  status?: 'all' | 'onSale' | 'soldOut' = 'all';
}
