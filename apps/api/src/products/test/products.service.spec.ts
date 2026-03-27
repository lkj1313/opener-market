import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from '../products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: {
    $queryRaw: jest.Mock;
    product: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn(),
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('returns on-sale and sold-out products with default latest sorting', async () => {
    prismaService.product.findMany.mockResolvedValue([]);

    const result = await service.findAll({});

    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      where: {
        status: {
          in: ['ON_SALE', 'SOLD_OUT'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 0,
      take: 20,
      select: {
        id: true,
        sellerId: true,
        name: true,
        price: true,
        stock: true,
        status: true,
        createdAt: true,
      },
    });
    expect(result).toEqual({
      items: [],
      page: 1,
      limit: 20,
    });
  });

  it('supports on-sale filtering with ascending price sort', async () => {
    const products = [
      {
        id: 'product-1',
        sellerId: 'seller-id',
        name: 'Mouse',
        price: BigInt(30000),
        stock: 10,
        status: 'ON_SALE',
        createdAt: new Date('2026-03-26T00:00:00.000Z'),
      },
    ];

    prismaService.product.findMany.mockResolvedValue(products);

    const result = await service.findAll({
      page: 2,
      limit: 5,
      sort: 'priceAsc',
      status: 'onSale',
    });

    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      where: {
        status: {
          in: ['ON_SALE'],
        },
      },
      orderBy: {
        price: 'asc',
      },
      skip: 5,
      take: 5,
      select: {
        id: true,
        sellerId: true,
        name: true,
        price: true,
        stock: true,
        status: true,
        createdAt: true,
      },
    });
    expect(result).toEqual({
      items: [
        {
          ...products[0],
          price: '30000',
        },
      ],
      page: 2,
      limit: 5,
    });
  });

  it('supports sold-out filtering with descending price sort', async () => {
    prismaService.product.findMany.mockResolvedValue([]);

    await service.findAll({
      sort: 'priceDesc',
      status: 'soldOut',
    });

    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      where: {
        status: {
          in: ['SOLD_OUT'],
        },
      },
      orderBy: {
        price: 'desc',
      },
      skip: 0,
      take: 20,
      select: {
        id: true,
        sellerId: true,
        name: true,
        price: true,
        stock: true,
        status: true,
        createdAt: true,
      },
    });
  });

  it('uses pg_trgm raw SQL search on product name when q is present', async () => {
    prismaService.$queryRaw.mockResolvedValue([
      {
        id: 'product-1',
        sellerId: 'seller-id',
        name: 'MacBook Pouch',
        price: BigInt(30000),
        stock: 10,
        status: 'ON_SALE',
        createdAt: new Date('2026-03-26T00:00:00.000Z'),
      },
    ]);

    const result = await service.findAll({
      q: '  macbook  ',
      sort: 'priceAsc',
    });

    expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prismaService.product.findMany).not.toHaveBeenCalled();
    expect(result).toEqual({
      items: [
        {
          id: 'product-1',
          sellerId: 'seller-id',
          name: 'MacBook Pouch',
          price: '30000',
          stock: 10,
          status: 'ON_SALE',
          createdAt: new Date('2026-03-26T00:00:00.000Z'),
        },
      ],
      page: 1,
      limit: 20,
    });
  });

  it('returns my products including hidden items', async () => {
    const products = [
      {
        id: 'product-2',
        name: 'Keyboard',
        price: BigInt(50000),
        stock: 3,
        status: 'HIDDEN',
        createdAt: new Date('2026-03-27T00:00:00.000Z'),
      },
      {
        id: 'product-1',
        name: 'Mouse',
        price: BigInt(30000),
        stock: 10,
        status: 'ON_SALE',
        createdAt: new Date('2026-03-26T00:00:00.000Z'),
      },
    ];

    prismaService.product.findMany.mockResolvedValue(products);

    const result = await service.findMyProducts('seller-id');

    expect(prismaService.product.findMany).toHaveBeenCalledWith({
      where: {
        sellerId: 'seller-id',
        status: {
          in: ['ON_SALE', 'SOLD_OUT', 'HIDDEN'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        status: true,
        createdAt: true,
      },
    });
    expect(result).toEqual([
      {
        ...products[0],
        price: '50000',
      },
      {
        ...products[1],
        price: '30000',
      },
    ]);
  });

  it('returns public product details', async () => {
    const product = {
      id: 'product-id',
      sellerId: 'seller-id',
      name: 'MacBook Pouch',
      description: '13-inch laptop pouch',
      price: BigInt(29000),
      stock: 12,
      status: 'SOLD_OUT',
      createdAt: new Date('2026-03-26T00:00:00.000Z'),
      updatedAt: new Date('2026-03-27T00:00:00.000Z'),
    };

    prismaService.product.findFirst.mockResolvedValue(product);

    const result = await service.findOne('product-id');

    expect(prismaService.product.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'product-id',
        status: {
          in: ['ON_SALE', 'SOLD_OUT'],
        },
      },
      select: {
        id: true,
        sellerId: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toEqual({
      ...product,
      price: '29000',
    });
  });

  it('throws when a public product cannot be found', async () => {
    prismaService.product.findFirst.mockResolvedValue(null);

    await expect(service.findOne('missing-product-id')).rejects.toEqual(
      new NotFoundException('상품을 찾을 수 없습니다.'),
    );
  });

  it('creates a product from seller id and DTO data', async () => {
    const createdProduct = {
      id: 'product-id',
      sellerId: 'seller-id',
      name: 'MacBook Pouch',
      description: '13-inch laptop pouch',
      price: BigInt(29000),
      stock: 12,
      status: 'ON_SALE',
      createdAt: new Date('2026-03-26T00:00:00.000Z'),
      updatedAt: new Date('2026-03-26T00:00:00.000Z'),
    };

    prismaService.product.create.mockResolvedValue(createdProduct);

    const result = await service.create('seller-id', {
      name: 'MacBook Pouch',
      description: '13-inch laptop pouch',
      price: 29000,
      stock: 12,
    });

    expect(prismaService.product.create).toHaveBeenCalledWith({
      data: {
        sellerId: 'seller-id',
        name: 'MacBook Pouch',
        description: '13-inch laptop pouch',
        price: BigInt(29000),
        stock: 12,
      },
      select: {
        id: true,
        sellerId: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toEqual({
      ...createdProduct,
      price: '29000',
    });
  });

  it('throws NotFoundException when updating a missing product', async () => {
    prismaService.product.findUnique.mockResolvedValue(null);

    await expect(
      service.update('missing-product-id', 'seller-id', {
        name: 'Updated Product',
      }),
    ).rejects.toEqual(new NotFoundException('상품을 찾을 수 없습니다.'));
  });

  it('throws ForbiddenException when updating another seller product', async () => {
    prismaService.product.findUnique.mockResolvedValue({
      id: 'product-id',
      sellerId: 'other-user-id',
    });

    await expect(
      service.update('product-id', 'seller-id', {
        name: 'Updated Product',
      }),
    ).rejects.toEqual(
      new ForbiddenException('본인 상품만 수정할 수 있습니다.'),
    );
  });

  it('updates only the provided fields', async () => {
    prismaService.product.findUnique.mockResolvedValue({
      id: 'product-id',
      sellerId: 'seller-id',
    });
    prismaService.product.update.mockResolvedValue({
      id: 'product-id',
      sellerId: 'seller-id',
      name: 'Updated Product',
      description: 'Existing description',
      price: BigInt(35000),
      stock: 12,
      status: 'SOLD_OUT',
      createdAt: new Date('2026-03-26T00:00:00.000Z'),
      updatedAt: new Date('2026-03-27T00:00:00.000Z'),
    });

    const result = await service.update('product-id', 'seller-id', {
      name: 'Updated Product',
      price: 35000,
      status: 'SOLD_OUT',
    });

    expect(prismaService.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      select: {
        id: true,
        sellerId: true,
      },
    });
    expect(prismaService.product.update).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      data: {
        name: 'Updated Product',
        price: BigInt(35000),
        status: 'SOLD_OUT',
      },
      select: {
        id: true,
        sellerId: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toEqual({
      id: 'product-id',
      sellerId: 'seller-id',
      name: 'Updated Product',
      description: 'Existing description',
      price: '35000',
      stock: 12,
      status: 'SOLD_OUT',
      createdAt: new Date('2026-03-26T00:00:00.000Z'),
      updatedAt: new Date('2026-03-27T00:00:00.000Z'),
    });
  });

  it('throws NotFoundException when removing a missing product', async () => {
    prismaService.product.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing-product-id', 'seller-id')).rejects.toEqual(
      new NotFoundException('상품을 찾을 수 없습니다.'),
    );
  });

  it('throws ForbiddenException when removing another seller product', async () => {
    prismaService.product.findUnique.mockResolvedValue({
      id: 'product-id',
      sellerId: 'other-user-id',
    });

    await expect(service.remove('product-id', 'seller-id')).rejects.toEqual(
      new ForbiddenException('본인 상품만 삭제할 수 있습니다.'),
    );
  });

  it('soft deletes a product', async () => {
    prismaService.product.findUnique.mockResolvedValue({
      id: 'product-id',
      sellerId: 'seller-id',
    });
    prismaService.product.update.mockResolvedValue({
      id: 'product-id',
    });

    const result = await service.remove('product-id', 'seller-id');

    expect(prismaService.product.update).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      data: {
        status: 'DELETED',
        deletedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      message: '상품이 삭제되었습니다.',
    });
  });
});
