import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(email: string, password: string, nickname: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname,
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.handleSignupError(error);
    }
  }

  private handleSignupError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;

      if (Array.isArray(target)) {
        if (target.includes('email')) {
          throw new ConflictException('이미 사용 중인 이메일입니다.');
        }

        if (target.includes('nickname')) {
          throw new ConflictException('이미 사용 중인 닉네임입니다.');
        }
      }

      throw new ConflictException('이미 사용 중인 회원가입 정보입니다.');
    }

    throw error;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedRefreshToken,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.hashedRefreshToken);

    if (!isMatch) {
      throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
    }

    const newPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(newPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const newRefreshToken = await this.jwtService.signAsync(newPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedRefreshToken,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedRefreshToken: null,
      },
    });
  }
}
