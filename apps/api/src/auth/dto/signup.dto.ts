import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
  @IsNotEmpty({ message: '이메일을 입력해 주세요.' })
  email: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(/[^A-Za-z0-9]/, {
    message: '비밀번호에는 특수문자가 최소 1자 이상 포함되어야 합니다.',
  })
  password: string;

  @IsString({ message: '닉네임은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '닉네임을 입력해 주세요.' })
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(8, { message: '닉네임은 최대 8자까지 가능합니다.' })
  nickname: string;
}
