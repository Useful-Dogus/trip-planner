import { Plugin } from '@nestjs/apollo';
import { Logger } from '@nestjs/common';
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
} from '@apollo/server';

interface FieldTrace {
  path: string;
  ms: number;
}

@Plugin()
export class TracingPlugin implements ApolloServerPlugin {
  private readonly logger = new Logger('GraphQL');

  async requestDidStart(
    _requestContext: GraphQLRequestContext<Record<string, unknown>>,
  ): Promise<GraphQLRequestListener<Record<string, unknown>>> {
    const start = Date.now();
    const fields: FieldTrace[] = [];
    const logger = this.logger;

    return {
      executionDidStart: async () => ({
        willResolveField: ({ info }) => {
          const fieldStart = Date.now();
          const path: string[] = [];
          for (
            let cur: typeof info.path | undefined = info.path;
            cur;
            cur = cur.prev
          ) {
            path.unshift(String(cur.key));
          }
          return () => {
            fields.push({ path: path.join('.'), ms: Date.now() - fieldStart });
          };
        },
      }),
      willSendResponse: async (ctx) => {
        const totalMs = Date.now() - start;
        const opName = ctx.request.operationName ?? 'anonymous';
        logger.log(`${opName} ${totalMs}ms (${fields.length} fields)`);
        if (ctx.response.body.kind === 'single') {
          ctx.response.body.singleResult.extensions = {
            ...(ctx.response.body.singleResult.extensions ?? {}),
            tracing: {
              totalMs,
              fields,
            },
          };
        }
      },
    };
  }
}
