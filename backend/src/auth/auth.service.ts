import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { SignOptions } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RefreshTokenBodyDto } from './dto/refresh-token.dto';
import type { RegisterDto } from './dto/register.dto';
import type { TokenPair } from './interfaces/token-pair.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.USER,
      },
    });

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async refresh(dto: RefreshTokenBodyDto): Promise<TokenPair> {
    const { sub, jti } = this.verifyRefreshJwt(dto.refreshToken);
    const session = await this.prisma.refreshToken.findUnique({
      where: { jti },
      include: { user: true },
    });

    if (!session || session.userId !== sub || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.refreshToken.delete({ where: { id: session.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: session.id } });

    const { user } = session;
    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async logout(dto: RefreshTokenBodyDto): Promise<{ ok: true }> {
    const jti = this.decodeRefreshTokenJti(dto.refreshToken);
    if (jti === undefined) {
      return { ok: true };
    }
    try {
      await this.prisma.refreshToken.deleteMany({ where: { jti } });
    } catch (err) {
      this.logger.error(
        `Failed to revoke refresh session (jti=${jti})`,
        err instanceof Error ? err.stack : err,
      );
      throw err;
    }
    return { ok: true };
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    role: Role,
  ): Promise<TokenPair> {
    const ttl =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ??
      this.config.get<string>('JWT_EXPIRES_IN') ??
      '15m';

    const accessToken = this.jwt.sign(
      { sub: userId, email, role },
      { expiresIn: ttl as SignOptions['expiresIn'] },
    );

    const refreshToken = await this.createRefreshSession(userId);
    return { accessToken, refreshToken };
  }

  private signRefreshJwt(userId: string, jti: string): string {
    const secret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.refreshExpiresSeconds();
    return jwt.sign({ sub: userId, typ: 'refresh', jti }, secret, {
      expiresIn,
    });
  }

  private decodeRefreshTokenJti(token: string): string | undefined {
    const decoded = jwt.decode(token, { complete: false }) as
      | (jwt.JwtPayload & { jti?: string; typ?: string })
      | null;
    if (
      !decoded ||
      decoded.typ !== 'refresh' ||
      typeof decoded.jti !== 'string'
    ) {
      return undefined;
    }
    return decoded.jti;
  }

  private verifyRefreshJwt(token: string): { sub: string; jti: string } {
    try {
      const secret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload & {
        typ?: string;
        jti?: string;
      };
      if (
        decoded.typ !== 'refresh' ||
        typeof decoded.jti !== 'string' ||
        typeof decoded.sub !== 'string'
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return { sub: decoded.sub, jti: decoded.jti };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async createRefreshSession(userId: string): Promise<string> {
    const jti = randomUUID();
    const expiresAt = new Date(
      Date.now() + this.refreshExpiresSeconds() * 1000,
    );

    const token = this.signRefreshJwt(userId, jti);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        jti,
        expiresAt,
      },
    });

    return token;
  }

  private refreshExpiresSeconds(): number {
    const v = Number(this.config.get<string>('JWT_REFRESH_EXPIRES_SECONDS'));
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 30 * 24 * 60 * 60;
  }
}
