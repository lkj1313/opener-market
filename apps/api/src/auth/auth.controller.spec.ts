import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    signup: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('컨트롤러가 정의되어 있어야 한다', () => {
    expect(controller).toBeDefined();
  });

  it('회원가입 요청 값을 AuthService.signup에 전달해야 한다', async () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'Password!23',
      nickname: 'tester',
    };

    authService.signup.mockResolvedValue({
      id: 'user-id',
      email: signupDto.email,
      nickname: signupDto.nickname,
      createdAt: new Date('2026-03-24T00:00:00.000Z'),
    });

    await controller.signup(signupDto);

    expect(authService.signup).toHaveBeenCalledWith(
      signupDto.email,
      signupDto.password,
      signupDto.nickname,
    );
  });

  it('로그인 시 리프레시 토큰 쿠키를 설정하고 액세스 토큰을 반환해야 한다', async () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password!23',
    };
    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await controller.login(loginDto, res);

    expect(authService.login).toHaveBeenCalledWith(
      loginDto.email,
      loginDto.password,
    );
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    expect(result).toEqual({
      accessToken: 'access-token',
    });
  });

  it('쿠키에서 리프레시 토큰을 읽고 쿠키를 갱신한 뒤 액세스 토큰을 반환해야 한다', async () => {
    const res = {
      cookie: jest.fn(),
    } as unknown as Response;
    const req = {
      cookies: {
        refreshToken: 'old-refresh-token',
      },
    } as unknown as Request;

    authService.refresh.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const result = await controller.refresh(res, req);

    expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'new-refresh-token',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      },
    );
    expect(result).toEqual({
      accessToken: 'new-access-token',
    });
  });

  it('로그아웃 시 리프레시 토큰 쿠키를 제거하고 서비스를 호출해야 한다', async () => {
    const res = {
      clearCookie: jest.fn(),
    } as unknown as Response;
    const req = {
      user: {
        userId: 'user-id',
        email: 'test@example.com',
      },
    } as Request & {
      user: {
        userId: string;
        email: string;
      };
    };

    authService.logout.mockResolvedValue(undefined);

    const result = await controller.logout(req, res);

    expect(authService.logout).toHaveBeenCalledWith('user-id');
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    expect(result).toEqual({
      message: '로그아웃되었습니다.',
    });
  });
});
