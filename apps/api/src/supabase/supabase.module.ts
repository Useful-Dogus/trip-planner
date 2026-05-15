import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseHealthIndicator } from './supabase.health';

@Global()
@Module({
  providers: [SupabaseService, SupabaseHealthIndicator],
  exports: [SupabaseService, SupabaseHealthIndicator],
})
export class SupabaseModule {}
