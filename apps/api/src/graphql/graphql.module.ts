import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { TracingPlugin } from './plugins/tracing.plugin';
import { SupabaseService } from '../supabase/supabase.service';
import { createLoaders } from '../trip/loaders';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [SupabaseService],
      useFactory: (supabase: SupabaseService) => ({
        autoSchemaFile: join(process.cwd(), 'apps/api/schema.gql'),
        sortSchema: true,
        path: '/graphql',
        playground: false,
        introspection: process.env.NODE_ENV !== 'production',
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
        context: () => ({
          loaders: createLoaders(supabase.client),
        }),
      }),
    }),
  ],
  providers: [TracingPlugin],
})
export class AppGraphqlModule {}
