import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth + Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testPrefix = 'auth-users-e2e';

  const getSetCookieHeader = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return [value];
    }

    return [];
  };

  const cleanupTestUsers = async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          {
            email: {
              startsWith: `${testPrefix}-`,
            },
          },
          {
            nickname: {
              startsWith: testPrefix,
            },
          },
        ],
      },
    });
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(cookieParser());

    await app.init();

    prisma = app.get(PrismaService);
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await app.close();
  });

  it('회원가입부터 로그아웃까지 인증 흐름이 동작해야 한다', async () => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const email = `${testPrefix}-${uniqueSuffix}@example.com`;
    const nickname = `u${uniqueSuffix}`;

    const agent = request.agent(app.getHttpServer());

    const signupResponse = await agent.post('/auth/signup').send({
      email,
      password: 'Password!23',
      nickname,
    });

    expect(signupResponse.status).toBe(201);
    expect(signupResponse.body).toMatchObject({
      email,
      nickname,
    });

    const loginResponse = await agent.post('/auth/login').send({
      email,
      password: 'Password!23',
    });

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
    expect(loginResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=')]),
    );

    const accessToken = loginResponse.body.accessToken as string;

    const meResponse = await agent
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toMatchObject({
      email,
      nickname,
      status: 'ACTIVE',
      cashBalance: '0',
      pointBalance: '0',
    });
    expect(meResponse.body).not.toHaveProperty('password');
    expect(meResponse.body).not.toHaveProperty('hashedRefreshToken');

    const refreshResponse = await agent.post('/auth/refresh');

    expect(refreshResponse.status).toBe(201);
    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=')]),
    );

    const rotatedRefreshCookie = getSetCookieHeader(
      refreshResponse.headers['set-cookie'],
    )[0]?.split(';')[0];

    expect(rotatedRefreshCookie).toEqual(expect.any(String));

    const rotatedAccessToken = refreshResponse.body.accessToken as string;

    const logoutResponse = await agent
      .post('/auth/logout')
      .set('Authorization', `Bearer ${rotatedAccessToken}`);

    expect(logoutResponse.status).toBe(201);
    expect(logoutResponse.body).toEqual({
      message: '로그아웃되었습니다.',
    });
    expect(logoutResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=;')]),
    );

    const refreshAfterLogoutResponse = await agent
      .post('/auth/refresh')
      .set('Cookie', rotatedRefreshCookie as string);

    expect(refreshAfterLogoutResponse.status).toBe(401);
  });
});
