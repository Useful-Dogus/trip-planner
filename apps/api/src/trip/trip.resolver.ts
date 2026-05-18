import { Args, ID, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Trip } from './models/trip.model';
import { Item } from './models/item.model';
import { Day } from './models/day.model';
import { Lodging } from './models/lodging.model';
import { Place } from './models/place.model';
import { TripService } from './trip.service';
import { TripLoaders } from './loaders';
import { Context } from '@nestjs/graphql';
import { LODGING_CATEGORY, ItemRow } from './types';

interface TripContext {
  loaders: TripLoaders;
}

interface TripRoot {
  id: string;
  rows: ItemRow[];
}

interface DayRoot {
  date: string;
  rows: ItemRow[];
}

function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    date: row.date,
    timeStart: row.time_start,
    timeEnd: row.time_end,
    memo: row.memo,
    budget: row.budget,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    googlePlaceId: row.google_place_id,
  };
}

function rowToLodging(row: ItemRow): Lodging {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    endDate: row.end_date,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    memo: row.memo,
  };
}

@Resolver(() => Trip)
export class TripResolver {
  constructor(private readonly service: TripService) {}

  @Query(() => Trip, { nullable: true })
  async trip(@Args('id', { type: () => ID }) id: string): Promise<TripRoot | null> {
    // 현재 단일 trip 모델 — id 값과 무관하게 전체 items 를 반환한다.
    // 다중 trip 도입(#108) 시 id 로 필터링한다.
    void id;
    const rows = await this.service.loadItems();
    return { id: 'current', rows };
  }

  @ResolveField(() => String, { nullable: true })
  title(@Parent() trip: TripRoot): string | null {
    void trip;
    return null;
  }

  @ResolveField(() => String, { nullable: true })
  startDate(@Parent() trip: TripRoot): string | null {
    const dates = trip.rows.map((r) => r.date).filter((d): d is string => !!d);
    return dates.length > 0 ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  }

  @ResolveField(() => String, { nullable: true })
  endDate(@Parent() trip: TripRoot): string | null {
    const candidates = trip.rows
      .flatMap((r) => [r.date, r.end_date])
      .filter((d): d is string => !!d);
    return candidates.length > 0 ? candidates.reduce((a, b) => (a > b ? a : b)) : null;
  }

  @ResolveField(() => [Day])
  days(@Parent() trip: TripRoot): DayRoot[] {
    const byDate = new Map<string, ItemRow[]>();
    for (const row of trip.rows) {
      if (row.category === LODGING_CATEGORY) continue;
      if (!row.date) continue;
      const bucket = byDate.get(row.date) ?? [];
      bucket.push(row);
      byDate.set(row.date, bucket);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rows]) => ({ date, rows }));
  }

  @ResolveField(() => [Lodging])
  lodgings(@Parent() trip: TripRoot): Lodging[] {
    return trip.rows.filter((r) => r.category === LODGING_CATEGORY).map(rowToLodging);
  }
}

@Resolver(() => Day)
export class DayResolver {
  @ResolveField(() => [Item])
  items(@Parent() day: DayRoot): Item[] {
    return day.rows.map(rowToItem);
  }
}

@Resolver(() => Item)
export class ItemResolver {
  @ResolveField(() => Place, { nullable: true })
  async place(
    @Parent() item: Item,
    @Context() ctx: TripContext,
  ): Promise<Place | null> {
    if (!item.googlePlaceId) return null;
    return ctx.loaders.placeById.load(item.googlePlaceId);
  }
}
