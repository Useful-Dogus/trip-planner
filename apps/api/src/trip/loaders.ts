import DataLoader from 'dataloader';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Place } from './models/place.model';
import { ItemRow } from './types';

export interface TripLoaders {
  /**
   * google_place_id → Place (현재는 items 자체 컬럼에서 derive).
   * 외부 Google Places API 캐시 도입 시 이 로더 본체만 교체하면 된다.
   */
  placeById: DataLoader<string, Place | null>;
}

/**
 * 요청 단위로 새 인스턴스를 만든다. 요청 간 캐시 누수를 방지한다.
 */
export function createLoaders(supabase: SupabaseClient): TripLoaders {
  return {
    placeById: new DataLoader<string, Place | null>(async (keys) => {
      const ids = Array.from(new Set(keys));
      const { data, error } = await supabase
        .from('items')
        .select('google_place_id, name, address, lat, lng')
        .in('google_place_id', ids);
      if (error) throw error;

      const byId = new Map<string, Place>();
      for (const row of (data ?? []) as Pick<
        ItemRow,
        'google_place_id' | 'name' | 'address' | 'lat' | 'lng'
      >[]) {
        if (!row.google_place_id || byId.has(row.google_place_id)) continue;
        byId.set(row.google_place_id, {
          id: row.google_place_id,
          name: row.name ?? null,
          address: row.address ?? null,
          lat: row.lat ?? null,
          lng: row.lng ?? null,
        });
      }
      return keys.map((k) => byId.get(k) ?? null);
    }),
  };
}
