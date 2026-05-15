import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { SupabaseModule } from './supabase/supabase.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [AppConfigModule, SupabaseModule, HealthModule],
})
export class AppModule {}
