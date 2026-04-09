import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  SCHEDULE_FILTERS_CACHE_KEY,
  SCHEDULE_FILTERS_CACHE_TTL_SECONDS,
} from './redis.constants';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL')?.trim();
    if (!url) {
      this.logger.warn(
        'REDIS_URL is not set; Redis caching is disabled (set REDIS_URL to enable)',
      );
      return;
    }
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    this.client.on('error', (err: Error) => {
      this.logger.warn(`Redis client error: ${err.message}`);
    });
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async getString(key: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      this.logger.warn(
        `Redis GET failed: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  async setString(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.client) {
      return;
    }
    try {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(
        `Redis SET failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) {
      return;
    }
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(
        `Redis DEL failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async invalidateScheduleFiltersCache(): Promise<void> {
    await this.del(SCHEDULE_FILTERS_CACHE_KEY);
  }

  scheduleFiltersCacheTtlSeconds(): number {
    const raw = this.config.get<string>('SCHEDULE_FILTERS_CACHE_TTL_SECONDS');
    const n =
      raw !== undefined ? Number(raw) : SCHEDULE_FILTERS_CACHE_TTL_SECONDS;
    return Number.isFinite(n) && n > 0
      ? Math.floor(n)
      : SCHEDULE_FILTERS_CACHE_TTL_SECONDS;
  }
}
