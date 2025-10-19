import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class SeedService {
  constructor(
    private readonly productService: ProductsService
  ){}

  async runSeed() {
    await this.insertNewProducts();
    return 'SEED EXECUTE'
  }

  private async insertNewProducts(): Promise<void> {
    await this.productService.removeAllProducts();

    const products = initialData.products;

    const insertPromises: Promise<Product>[] = [];

    products.forEach(product => {
      insertPromises.push(this.productService.create(product) as Promise<Product>);
    });

    await Promise.all(insertPromises);
  } 
}
