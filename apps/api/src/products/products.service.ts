import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const q = query.q?.trim();
    const sort = query.sort ?? 'latest';
    const status = query.status ?? 'all';

    const orderBy =
      sort === 'priceAsc'
        ? { price: 'asc' as const }
        : sort === 'priceDesc'
          ? { price: 'desc' as const }
          : { createdAt: 'desc' as const };

    const statusFilter: ProductStatus[] =
      status === 'onSale'
        ? [ProductStatus.ON_SALE]
        : status === 'soldOut'
          ? [ProductStatus.SOLD_OUT]
          : [ProductStatus.ON_SALE, ProductStatus.SOLD_OUT];

    if (q) {
      return this.findAllWithTrigramSearch({
        page,
        limit,
        q,
        sort,
        statusFilter,
      });
    }

    const where: Prisma.ProductWhereInput = {
      status: {
        in: statusFilter,
      },
    };

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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

    return {
      items: products.map((product) => ({
        ...product,
        price: product.price.toString(),
      })),
      page,
      limit,
    };
  }

  private async findAllWithTrigramSearch(params: {
    page: number;
    limit: number;
    q: string;
    sort: 'latest' | 'priceAsc' | 'priceDesc';
    statusFilter: ProductStatus[];
  }) {
    const { page, limit, q, sort, statusFilter } = params;
    const offset = (page - 1) * limit;

    const statusSql = Prisma.join(
      statusFilter.map((status) => Prisma.sql`${status}::"ProductStatus"`),
    );

    const orderBySql =
      sort === 'priceAsc'
        ? Prisma.sql`score DESC, "price" ASC, "createdAt" DESC`
        : sort === 'priceDesc'
          ? Prisma.sql`score DESC, "price" DESC, "createdAt" DESC`
          : Prisma.sql`score DESC, "createdAt" DESC`;

    const products = await this.prisma.$queryRaw<
      Array<{
        id: string;
        sellerId: string;
        name: string;
        price: bigint;
        stock: number;
        status: ProductStatus;
        createdAt: Date;
      }>
    >(Prisma.sql`
      SELECT
        "id",
        "sellerId",
        "name",
        "price",
        "stock",
        "status",
        "createdAt",
        similarity("name", ${q}) AS score
      FROM "Product"
      WHERE "status" IN (${statusSql})
        AND (
          "name" % ${q}
          OR "name" ILIKE ${`%${q}%`}
        )
      ORDER BY ${orderBySql}
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return {
      items: products.map((product) => ({
        ...product,
        price: product.price.toString(),
      })),
      page,
      limit,
    };
  }

  async findMyProducts(userId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        sellerId: userId,
        status: {
          in: [
            ProductStatus.ON_SALE,
            ProductStatus.SOLD_OUT,
            ProductStatus.HIDDEN,
          ],
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

    return products.map((product) => ({
      ...product,
      price: product.price.toString(),
    }));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: {
          in: [ProductStatus.ON_SALE, ProductStatus.SOLD_OUT],
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

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return {
      ...product,
      price: product.price.toString(),
    };
  }

  async create(sellerId: string, createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        sellerId,
        name: createProductDto.name,
        description: createProductDto.description,
        price: BigInt(createProductDto.price),
        stock: createProductDto.stock,
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

    return {
      ...product,
      price: product.price.toString(),
    };
  }

  async update(id: string, userId: string, updateProductDto: UpdateProductDto) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    if (existingProduct.sellerId !== userId) {
      throw new ForbiddenException('본인 상품만 수정할 수 있습니다.');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...(updateProductDto.name !== undefined && {
          name: updateProductDto.name,
        }),
        ...(updateProductDto.description !== undefined && {
          description: updateProductDto.description,
        }),
        ...(updateProductDto.price !== undefined && {
          price: BigInt(updateProductDto.price),
        }),
        ...(updateProductDto.stock !== undefined && {
          stock: updateProductDto.stock,
        }),
        ...(updateProductDto.status !== undefined && {
          status: updateProductDto.status,
        }),
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

    return {
      ...updatedProduct,
      price: updatedProduct.price.toString(),
    };
  }

  async remove(id: string, userId: string) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    if (existingProduct.sellerId !== userId) {
      throw new ForbiddenException('본인 상품만 삭제할 수 있습니다.');
    }

    await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    return {
      message: '상품이 삭제되었습니다.',
    };
  }
}
