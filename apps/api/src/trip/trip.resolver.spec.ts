import { Test } from '@nestjs/testing';
import { Global, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { tmpdir } from 'os';
import { TripModule } from './trip.module';
import { SupabaseService } from '../supabase/supabase.service';
import { createLoaders } from './loaders';
import { ItemRow } from './types';

const sampleRows: ItemRow[] = [
  {
    id: 'i1',
    name: '도쿄타워',
    category: '관광',
    status: null,
    reservation_status: null,
    priority: null,
    address: '도쿄',
    lat: 35.6586,
    lng: 139.7454,
    links: [],
    budget: null,
    memo: null,
    date: '2026-06-01',
    end_date: null,
    time_start: '10:00',
    time_end: null,
    is_franchise: null,
    branches: null,
    google_place_id: 'place-A',
    created_at: 't',
    updated_at: 't',
  },
  {
    id: 'i2',
    name: '시부야 호텔',
    category: '숙박',
    status: null,
    reservation_status: null,
    priority: null,
    address: '시부야',
    lat: null,
    lng: null,
    links: [],
    budget: null,
    memo: null,
    date: '2026-06-01',
    end_date: '2026-06-03',
    time_start: null,
    time_end: null,
    is_franchise: null,
    branches: null,
    google_place_id: null,
    created_at: 't',
    updated_at: 't',
  },
];

class FakeSupabase {
  client = {
    from: (_table: string) => {
      const builder = {
        _filterIds: null as string[] | null,
        select: (_cols: string) => builder,
        order: (_col: string, _opts: unknown) =>
          Promise.resolve({ data: sampleRows, error: null }),
        in: (_col: string, ids: string[]) => {
          builder._filterIds = ids;
          return Promise.resolve({
            data: sampleRows
              .filter(
                (r) =>
                  r.google_place_id && (builder._filterIds ?? []).includes(r.google_place_id),
              )
              .map((r) => ({
                google_place_id: r.google_place_id,
                name: r.name,
                address: r.address,
                lat: r.lat,
                lng: r.lng,
              })),
            error: null,
          });
        },
      };
      return builder;
    },
  };
}

describe('TripResolver (e2e smoke)', () => {
  let app: import('@nestjs/common').INestApplication;

  beforeAll(async () => {
    const fakeSupabase = new FakeSupabase();

    @Global()
    @Module({
      providers: [{ provide: SupabaseService, useValue: fakeSupabase }],
      exports: [SupabaseService],
    })
    class FakeSupabaseModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        FakeSupabaseModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
          driver: ApolloDriver,
          inject: [SupabaseService],
          useFactory: (supabase: SupabaseService) => ({
            autoSchemaFile: join(tmpdir(), `schema-${Date.now()}.gql`),
            sortSchema: true,
            playground: false,
            context: () => ({ loaders: createLoaders(supabase.client as never) }),
          }),
        }),
        TripModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns trip tree with days, items, lodgings, and place', async () => {
    const httpServer = app.getHttpServer();
    const supertest = (await import('supertest')).default;
    const res = await supertest(httpServer)
      .post('/graphql')
      .send({
        query: `query { trip(id:"current"){ id startDate endDate
          days { date items { id name place { id name } } }
          lodgings { id name date endDate } } }`,
      });
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    const trip = res.body.data.trip;
    expect(trip.id).toBe('current');
    expect(trip.startDate).toBe('2026-06-01');
    expect(trip.endDate).toBe('2026-06-03');
    expect(trip.days).toHaveLength(1);
    expect(trip.days[0].items[0].place).toEqual({ id: 'place-A', name: '도쿄타워' });
    expect(trip.lodgings).toHaveLength(1);
    expect(trip.lodgings[0].name).toBe('시부야 호텔');
  });

  it('returns null place when googlePlaceId is missing', async () => {
    const httpServer = app.getHttpServer();
    const supertest = (await import('supertest')).default;
    const res = await supertest(httpServer)
      .post('/graphql')
      .send({
        query: `query { trip(id:"current"){ lodgings { id name } } }`,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.trip.lodgings[0].id).toBe('i2');
  });
});
