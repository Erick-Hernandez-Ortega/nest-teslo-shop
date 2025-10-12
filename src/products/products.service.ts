import { CreateProductDto } from './dto/create-product.dto';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as IsUUID } from 'uuid';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductsService {
  private readonly logger: Logger = new Logger(ProductsService.name);

  // Repository patron
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product | undefined> {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product: Product = this.productRepository.create({...productDetails, images: images.map(image => this.productImageRepository.create({url: image}))});
      await this.productRepository.save(product);

      return product;
    } catch (error: any) {
      this.handleExeptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });

    return products.map(product => ({
      ...product,
      images: product.images ? product.images?.map(img => img.url) : []
    }));
  }

  async findOne(term: string): Promise<Product> {
    let product: Product | null;

    if (IsUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder.where('UPPER(title) =:title or slug =:slug', {
        title: term.toUpperCase(),
        slug: term.toLowerCase()
      })
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getOne();
    }

    if (!product) throw new NotFoundException(`Product with term ${term} is not found`)

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product | undefined> {
    const product: Product | undefined = await this.productRepository.preload({ id, ...updateProductDto, images: [] });

    if (!product) throw new NotFoundException(`Product with id ${id} not found`)
    try {
      return this.productRepository.save(product);
    } catch (error: any) {
      this.handleExeptions(error);
    }
  }

  async remove(id: string): Promise<void> {
    const product: Product = await this.findOne(id);

    await this.productRepository.remove(product);
  }

  private handleExeptions(error: any): void {
    if (error?.code === '23505') {
      throw new BadRequestException(`${error?.detail}`)
    }

    this.logger.error(error);
    throw new InternalServerErrorException(`Error: ${error}`);
  }
}
