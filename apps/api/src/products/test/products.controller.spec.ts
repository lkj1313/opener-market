import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { CreateProductDto } from '../dto/create-product.dto';
import { GetProductsQueryDto } from '../dto/get-products-query.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductsController } from '../products.controller';
import { ProductsService } from '../products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: {
    findAll: jest.Mock;
    findMyProducts: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    productsService = {
      findAll: jest.fn(),
      findMyProducts: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: productsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes product list query parameters through to the service', async () => {
    const query: GetProductsQueryDto = {
      page: 2,
      limit: 10,
      q: 'macbook',
      sort: 'priceAsc',
      status: 'soldOut',
    };

    productsService.findAll.mockResolvedValue({
      items: [],
      page: 2,
      limit: 10,
    });

    const result = await controller.findAll(query);

    expect(productsService.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual({
      items: [],
      page: 2,
      limit: 10,
    });
  });

  it('passes the authenticated seller id to my-products lookup', async () => {
    const req = {
      user: {
        userId: 'seller-id',
        email: 'seller@example.com',
      },
    } as AuthenticatedRequest;

    productsService.findMyProducts.mockResolvedValue([]);

    const result = await controller.findMyProducts(req);

    expect(productsService.findMyProducts).toHaveBeenCalledWith('seller-id');
    expect(result).toEqual([]);
  });

  it('passes the product id to detail lookup', async () => {
    productsService.findOne.mockResolvedValue({
      id: 'product-id',
      sellerId: 'seller-id',
      name: 'MacBook Pouch',
      description: '13-inch laptop pouch',
      price: '29000',
      stock: 12,
      status: 'ON_SALE',
    });

    const result = await controller.findOne('product-id');

    expect(productsService.findOne).toHaveBeenCalledWith('product-id');
    expect(result).toEqual({
      id: 'product-id',
      sellerId: 'seller-id',
      name: 'MacBook Pouch',
      description: '13-inch laptop pouch',
      price: '29000',
      stock: 12,
      status: 'ON_SALE',
    });
  });

  it('passes seller id and create payload to the service', async () => {
    const createProductDto: CreateProductDto = {
      name: 'MacBook Pouch',
      description: '13-inch laptop pouch',
      price: 29000,
      stock: 12,
    };
    const req = {
      user: {
        userId: 'seller-id',
        email: 'seller@example.com',
      },
    } as AuthenticatedRequest;

    productsService.create.mockResolvedValue({
      id: 'product-id',
      sellerId: 'seller-id',
      ...createProductDto,
      price: '29000',
      status: 'ON_SALE',
    });

    const result = await controller.create(createProductDto, req);

    expect(productsService.create).toHaveBeenCalledWith(
      'seller-id',
      createProductDto,
    );
    expect(result).toEqual({
      id: 'product-id',
      sellerId: 'seller-id',
      name: 'MacBook Pouch',
      description: '13-inch laptop pouch',
      price: '29000',
      stock: 12,
      status: 'ON_SALE',
    });
  });

  it('passes product id, seller id, and update payload to the service', async () => {
    const updateProductDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 35000,
      status: 'SOLD_OUT',
    };
    const req = {
      user: {
        userId: 'seller-id',
        email: 'seller@example.com',
      },
    } as AuthenticatedRequest;

    productsService.update.mockResolvedValue({
      id: 'product-id',
      sellerId: 'seller-id',
      name: 'Updated Product',
      description: 'Existing description',
      price: '35000',
      stock: 12,
      status: 'SOLD_OUT',
    });

    const result = await controller.update('product-id', updateProductDto, req);

    expect(productsService.update).toHaveBeenCalledWith(
      'product-id',
      'seller-id',
      updateProductDto,
    );
    expect(result).toEqual({
      id: 'product-id',
      sellerId: 'seller-id',
      name: 'Updated Product',
      description: 'Existing description',
      price: '35000',
      stock: 12,
      status: 'SOLD_OUT',
    });
  });

  it('passes product id and seller id to remove', async () => {
    const req = {
      user: {
        userId: 'seller-id',
        email: 'seller@example.com',
      },
    } as AuthenticatedRequest;

    productsService.remove.mockResolvedValue({
      message: '?곹뭹????젣?섏뿀?듬땲??',
    });

    const result = await controller.remove('product-id', req);

    expect(productsService.remove).toHaveBeenCalledWith(
      'product-id',
      'seller-id',
    );
    expect(result).toEqual({
      message: '?곹뭹????젣?섏뿀?듬땲??',
    });
  });
});
