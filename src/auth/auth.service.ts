import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });
      await this.userRepository.save(user);
      user.password = '';

      return {
        ...user,
        token: this.getJwtToken({
          id: user.id
        })
      };
    } catch (error: unknown) {
      this.handleExeptions(error)
    }
  }

  async login(loginUserDto: LoginUserDto) {

    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true }
    });

    if (!user) throw new UnauthorizedException('Credentials not valid');

    if (!bcrypt.compareSync(password, user.password)) throw new UnauthorizedException('Credentials not valid');

    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    };
  }

  private getJwtToken(payload: JwtPayload): string {
    const token: string = this.jwtService.sign(payload);
    return token;
  }

  private handleExeptions(error: any): void {
    if (error?.code === '23505') {
      throw new BadRequestException(`${error?.detail}`)
    }

    this.logger.error(error);
    throw new InternalServerErrorException(`Error: ${error}`);
  }
}
