import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ItemRow } from './types';

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async loadItems(): Promise<ItemRow[]> {
    const { data, error } = await this.supabase.client
      .from('items')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      this.logger.error(`Supabase items query failed: ${error.message}`);
      throw error;
    }
    return (data ?? []) as ItemRow[];
  }
}
