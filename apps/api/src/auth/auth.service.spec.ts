import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };

  beforeEach(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.NODE_ENV = 'test';

    prismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('서비스가 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  it('회원가입 시 비밀번호를 해시하고 사용자를 생성해야 한다', async () => {
    const hashedPassword = 'hashed-password';
    const createdUser = {
      id: 'user-id',
      email: 'test@example.com',
      nickname: 'tester',
      createdAt: new Date('2026-03-24T00:00:00.000Z'),
    };

    const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
    hashMock.mockResolvedValue(hashedPassword as never);
    prismaService.user.create.mockResolvedValue(createdUser);

    const result = await service.signup(
      'test@example.com',
      'Password!23',
      'tester',
    );

    expect(hashMock).toHaveBeenCalledWith('Password!23', 10);
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        nickname: 'tester',
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });
    expect(result).toEqual(createdUser);
  });

  it('회원가입 시 이메일 중복이면 ConflictException을 던져야 한다', async () => {
    const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
    hashMock.mockResolvedValue('hashed-password' as never);
    prismaService.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.5.0',
        meta: {
          target: ['email'],
        },
      }),
    );

    await expect(
      service.signup('test@example.com', 'Password!23', 'tester'),
    ).rejects.toEqual(new ConflictException('이미 사용 중인 이메일입니다.'));
  });

  it('회원가입 시 닉네임 중복이면 ConflictException을 던져야 한다', async () => {
    const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
    hashMock.mockResolvedValue('hashed-password' as never);
    prismaService.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.5.0',
        meta: {
          target: ['nickname'],
        },
      }),
    );

    await expect(
      service.signup('test@example.com', 'Password!23', 'tester'),
    ).rejects.toEqual(new ConflictException('이미 사용 중인 닉네임입니다.'));
  });

  it('회원가입 시 중복 대상이 불명확하면 일반 중복 예외를 던져야 한다', async () => {
    const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
    hashMock.mockResolvedValue('hashed-password' as never);
    prismaService.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.5.0',
      }),
    );

    await expect(
      service.signup('test@example.com', 'Password!23', 'tester'),
    ).rejects.toEqual(
      new ConflictException('이미 사용 중인 회원가입 정보입니다.'),
    );
  });

  it('로그인 대상 사용자가 없으면 UnauthorizedException을 던져야 한다', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login('missing@example.com', 'Password!23'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'missing@example.com' },
    });
    expect(jwtService.signAsync).not.toHaveBeenCalled();
    expect(prismaService.user.update).not.toHaveBeenCalled();
  });

  it('로그인 비밀번호가 일치하지 않으면 UnauthorizedException을 던져야 한다', async () => {
    const compareMock = bcrypt.compare as jest.MockedFunction<
      typeof bcrypt.compare
    >;

    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      password: 'stored-password-hash',
    });
    compareMock.mockResolvedValue(false as never);

    await expect(
      service.login('test@example.com', 'WrongPassword!23'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(compareMock).toHaveBeenCalledWith(
      'WrongPassword!23',
      'stored-password-hash',
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
    expect(prismaService.user.update).not.toHaveBeenCalled();
  });

  it('로그인에 성공하면 토큰을 반환하고 해시된 리프레시 토큰을 저장해야 한다', async () => {
    const compareMock = bcrypt.compare as jest.MockedFunction<
      typeof bcrypt.compare
    >;
    const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      password: 'stored-password-hash',
    });
    compareMock.mockResolvedValue(true as never);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    hashMock.mockResolvedValueOnce('hashed-refresh-token' as never);
    prismaService.user.update.mockResolvedValue({
      id: 'user-id',
      hashedRefreshToken: 'hashed-refresh-token',
    });

    const result = await service.login('test@example.com', 'Password!23');

    expect(compareMock).toHaveBeenCalledWith(
      'Password!23',
      'stored-password-hash',
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      { sub: 'user-id', email: 'test@example.com' },
      {
        secret: 'test-access-secret',
        expiresIn: '15m',
      },
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      { sub: 'user-id', email: 'test@example.com' },
      {
        secret: 'test-refresh-secret',
        expiresIn: '7d',
      },
    );
    expect(hashMock).toHaveBeenCalledWith('refresh-token', 10);
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        hashedRefreshToken: 'hashed-refresh-token',
      },
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('리프레시 토큰 검증에 실패하면 UnauthorizedException을 던져야 한다', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(service.refresh('bad-refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('bad-refresh-token', {
      secret: 'test-refresh-secret',
    });
    expect(prismaService.user.findUnique).not.toHaveBeenCalled();
  });

  it('사용자 또는 저장된 리프레시 토큰이 없으면 UnauthorizedException을 던져야 한다', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'test@example.com',
    });
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      hashedRefreshToken: null,
    });

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id' },
    });
  });

  it('리프레시 토큰 해시가 일치하지 않으면 UnauthorizedException을 던져야 한다', async () => {
    const compareMock = bcrypt.compare as jest.MockedFunction<
      typeof bcrypt.compare
    >;

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'test@example.com',
    });
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      hashedRefreshToken: 'stored-refresh-token-hash',
    });
    compareMock.mockResolvedValue(false as never);

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(compareMock).toHaveBeenCalledWith(
      'refresh-token',
      'stored-refresh-token-hash',
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('리프레시 요청에 성공하면 토큰을 재발급하고 저장된 리프레시 토큰도 갱신해야 한다', async () => {
    const compareMock = bcrypt.compare as jest.MockedFunction<
      typeof bcrypt.compare
    >;
    const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'test@example.com',
    });
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      hashedRefreshToken: 'stored-refresh-token-hash',
    });
    compareMock.mockResolvedValue(true as never);
    jwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');
    hashMock.mockResolvedValueOnce('new-hashed-refresh-token' as never);

    const result = await service.refresh('refresh-token');

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
      secret: 'test-refresh-secret',
    });
    expect(compareMock).toHaveBeenCalledWith(
      'refresh-token',
      'stored-refresh-token-hash',
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      { sub: 'user-id', email: 'test@example.com' },
      {
        secret: 'test-access-secret',
        expiresIn: '15m',
      },
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      { sub: 'user-id', email: 'test@example.com' },
      {
        secret: 'test-refresh-secret',
        expiresIn: '7d',
      },
    );
    expect(hashMock).toHaveBeenCalledWith('new-refresh-token', 10);
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        hashedRefreshToken: 'new-hashed-refresh-token',
      },
    });
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('로그아웃 시 저장된 리프레시 토큰을 제거해야 한다', async () => {
    prismaService.user.update.mockResolvedValue({
      id: 'user-id',
      hashedRefreshToken: null,
    });

    await service.logout('user-id');

    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        hashedRefreshToken: null,
      },
    });
  });
});
