import { Controller, Post, Body, Get, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { RawHeaders } from './decorators/raw-headers.decorator';
import { UserRoleGuard } from './guards/user-role.guard';
import { RoleProtected } from './decorators/role-protected.decorator';
import { ValidRoles } from './interfaces/valid-roles';
import { UserRole2Guard } from './guards/user-role2.guard';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(@GetUser('email') userEmail: string, @GetUser() user: User, @RawHeaders() rawHeader: string[]) {

    return {
      ok: true,
      userEmail,
      user,
      rawHeader
    }
  }

  @Get('private2')
  @SetMetadata('roles', ['admin', 'super-admin'])
  @UseGuards(AuthGuard(), UserRoleGuard)
  testingPrivateRoute2() {
    return {
      ok: true
    }
  }

  @Get('private3')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard(), UserRole2Guard)
  testingPrivateRoute3() {
    return {
      ok: true
    }
  }

  @Get('private4')
  @Auth(ValidRoles.admin)
  testingPrivateRoute4() {
    return {
      ok: true
    }
  }
}
