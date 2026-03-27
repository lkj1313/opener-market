import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testPrefix = 'products-e2e';

  const cleanupTestData = async () => {
    const users = await prisma.user.findMany({
      where: {
        email: {
          startsWith: `${testPrefix}-`,
        },
      },
      select: {
        id: true,
      },
    });

    const userIds = users.map((user) => user.id);

    if (userIds.length > 0) {
      await prisma.product.deleteMany({
        where: {
          sellerId: {
            in: userIds,
          },
        },
      });
    }

    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: `${testPrefix}-`,
        },
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
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  it('상품 생성부터 삭제까지 판매자 흐름이 동작해야 한다', async () => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const email = `${testPrefix}-${uniqueSuffix}@example.com`;
    const nickname = `p${uniqueSuffix}`;
    const productName = `테스트 상품 ${uniqueSuffix}`;

    const agent = request.agent(app.getHttpServer());

    const signupResponse = await agent.post('/auth/signup').send({
      email,
      password: 'Password!23',
      nickname,
    });

    expect(signupResponse.status).toBe(201);

    const loginResponse = await agent.post('/auth/login').send({
      email,
      password: 'Password!23',
    });

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body.accessToken).toEqual(expect.any(String));

    const accessToken = loginResponse.body.accessToken as string;

    const createResponse = await agent
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: productName,
        description: '상품 e2e 테스트 설명',
        price: 15000,
        stock: 7,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      sellerId: signupResponse.body.id,
      name: productName,
      description: '상품 e2e 테스트 설명',
      price: '15000',
      stock: 7,
      status: 'ON_SALE',
    });

    const productId = createResponse.body.id as string;

    const publicListResponse = await agent
      .get('/products')
      .query({ status: 'all' });

    expect(publicListResponse.status).toBe(200);
    expect(publicListResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productId,
          sellerId: signupResponse.body.id,
          name: productName,
          price: '15000',
          status: 'ON_SALE',
        }),
      ]),
    );

    const myProductsResponse = await agent
      .get('/products/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(myProductsResponse.status).toBe(200);
    expect(myProductsResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productId,
          name: productName,
          price: '15000',
          status: 'ON_SALE',
        }),
      ]),
    );

    const detailResponse = await agent.get(`/products/${productId}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toMatchObject({
      id: productId,
      sellerId: signupResponse.body.id,
      name: productName,
      description: '상품 e2e 테스트 설명',
      price: '15000',
      stock: 7,
      status: 'ON_SALE',
    });

    const updateResponse = await agent
      .patch(`/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        price: 17000,
        stock: 3,
        status: 'SOLD_OUT',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      id: productId,
      price: '17000',
      stock: 3,
      status: 'SOLD_OUT',
    });

    const soldOutListResponse = await agent
      .get('/products')
      .query({ status: 'soldOut', sort: 'priceDesc' });

    expect(soldOutListResponse.status).toBe(200);
    expect(soldOutListResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productId,
          price: '17000',
          status: 'SOLD_OUT',
        }),
      ]),
    );

    const deleteResponse = await agent
      .delete(`/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      message: expect.any(String),
    });

    const deletedDetailResponse = await agent.get(`/products/${productId}`);

    expect(deletedDetailResponse.status).toBe(404);

    const myProductsAfterDeleteResponse = await agent
      .get('/products/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(myProductsAfterDeleteResponse.status).toBe(200);
    expect(myProductsAfterDeleteResponse.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productId,
        }),
      ]),
    );
  });
});
