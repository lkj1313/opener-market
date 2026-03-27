import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString({ message: '상품명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '상품명을 입력해주세요.' })
  @MinLength(1, { message: '상품명은 최소 1자 이상이어야 합니다.' })
  @MaxLength(100, { message: '상품명은 최대 100자까지 가능합니다.' })
  name: string;

  @IsString({ message: '상품 설명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '상품 설명을 입력해주세요.' })
  @MinLength(1, { message: '상품 설명은 최소 1자 이상이어야 합니다.' })
  @MaxLength(5000, { message: '상품 설명은 최대 5000자까지 가능합니다.' })
  description: string;

  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: '가격은 소수점 없는 숫자여야 합니다.' },
  )
  @Min(0, { message: '가격은 0원 이상이어야 합니다.' })
  price: number;

  @IsInt({ message: '재고는 정수여야 합니다.' })
  @Min(0, { message: '재고는 0개 이상이어야 합니다.' })
  stock: number;
}
