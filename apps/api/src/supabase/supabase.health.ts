import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { SupabaseService } from './supabase.service';

@Injectable()
export class SupabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const { error } = await this.supabase.client
      .from('items')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw new HealthCheckError(
        'Supabase ping failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
    return this.getStatus(key, true);
  }
}
