import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface AccountInfo {
  id: number;
  username: string;
  isActivated: boolean;
  isSuperuser: boolean;
}

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);
  private readonly baseUrl: string;
  private readonly internalKey: string;
  private cache = new Map<number, { data: AccountInfo; expires: number }>();
  private readonly CACHE_TTL = 30_000;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get('AUTH_SERVER_URL') || 'http://localhost:3001';
    this.internalKey = this.configService.get('INTERNAL_API_KEY') || '';
  }

  async getAccountInfo(id: number): Promise<AccountInfo | null> {
    const cached = this.cache.get(id);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const { data } = await axios.get<AccountInfo>(
        `${this.baseUrl}/account/internal/info/${id}`,
        { headers: { 'X-Internal-Key': this.internalKey }, timeout: 5000 },
      );

      this.cache.set(id, { data, expires: Date.now() + this.CACHE_TTL });
      return data;
    } catch (e) {
      this.logger.error(`Failed to fetch account ${id}: ${e.message}`);
      return null;
    }
  }

  clearCache(id?: number) {
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
    }
  }
}
