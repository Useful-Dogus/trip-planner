import { Module } from '@nestjs/common';
import { TripService } from './trip.service';
import { DayResolver, ItemResolver, TripResolver } from './trip.resolver';

@Module({
  providers: [TripService, TripResolver, DayResolver, ItemResolver],
  exports: [TripService],
})
export class TripModule {}
