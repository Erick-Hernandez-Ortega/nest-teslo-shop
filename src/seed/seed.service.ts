import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { Product } from 'src/products/entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeedService {
  constructor(
    private readonly productService: ProductsService,
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) { }

  async runSeed(): Promise<string> {
    await this.removeTables();
    const user: User = await this.insertUsers();
    await this.insertNewProducts(user);
    return 'SEED EXECUTE'
  }

  private async removeTables(): Promise<void> {
    await this.productService.removeAllProducts();
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async insertUsers(): Promise<User> {
    const seedUsers = initialData.users;

    const users: User[] = [];
    seedUsers.forEach(user => {
      users.push(this.userRepository.create(user))
    })

    const dbUsers: User[] = await this.userRepository.save(users);

    return dbUsers[0];
  }

  private async insertNewProducts(user: User): Promise<void> {
    await this.productService.removeAllProducts();

    const products = initialData.products;

    const insertPromises: Promise<Product>[] = [];

    products.forEach(product => {
      insertPromises.push(this.productService.create(product, user) as Promise<Product>);
    });

    await Promise.all(insertPromises);
  }
}
