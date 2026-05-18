import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { SupabaseModule } from './supabase/supabase.module';
import { HealthModule } from './health/health.module';
import { AppGraphqlModule } from './graphql/graphql.module';
import { TripModule } from './trip/trip.module';

@Module({
  imports: [AppConfigModule, SupabaseModule, HealthModule, AppGraphqlModule, TripModule],
})
export class AppModule {}
