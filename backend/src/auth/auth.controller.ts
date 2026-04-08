import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenBodyDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenPairDto, UserPublicDto } from './dto/response/token-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtUser } from './interfaces/jwt-user.interface';
import type { TokenPair } from './interfaces/token-pair.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register (USER)' })
  @ApiResponse({ status: 201, type: TokenPairDto })
  async register(@Body() dto: RegisterDto): Promise<TokenPair> {
    return await this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email/password' })
  @ApiResponse({ status: 200, type: TokenPairDto })
  async login(@Body() dto: LoginDto): Promise<TokenPair> {
    return await this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate access + refresh tokens' })
  @ApiResponse({ status: 200, type: TokenPairDto })
  async refresh(@Body() dto: RefreshTokenBodyDto): Promise<TokenPair> {
    return await this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke refresh session' })
  @ApiResponse({ status: 200 })
  async logout(@Body() dto: RefreshTokenBodyDto): Promise<{ ok: true }> {
    return await this.authService.logout(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Current user (requires access JWT)' })
  @ApiResponse({ status: 200, type: UserPublicDto })
  me(@CurrentUser() user: JwtUser): UserPublicDto {
    return {
      id: user.userId,
      email: user.email,
      role: user.role,
    };
  }
}
