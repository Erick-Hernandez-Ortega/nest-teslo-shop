import { CreateProductDto } from './dto/create-product.dto';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as IsUUID} from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger: Logger = new Logger(ProductsService.name);

  // Repository patron
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) { }

  async create(createProductDto: CreateProductDto): Promise<Product | undefined> {
    try {
      const product: Product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);

      return product;
    } catch (error: any) {
      this.handleExeptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<Product[]> {
    const { limit = 10, offset = 0} = paginationDto;
    return await this.productRepository.find({
      take: limit,
      skip: offset
    });
  }

  async findOne(term: string): Promise<Product> {
    let product: Product | null;

    if (IsUUID(term)) {
      product = await this.productRepository.findOneBy({id: term});
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder.where('UPPER(title) =:title or slug =:slug', {
        title: term.toUpperCase(),
        slug: term.toLowerCase()
      }).getOne();
    }

    if (!product) throw new NotFoundException(`Product with term ${term} is not found`)

    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
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
