import { AzureFunction, Context, HttpRequest, HttpResponse } from '@azure/functions';
import { TypeOf, ZodArray, ZodEffects, ZodError, ZodIssue, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';
import {
  HttpError,
  NotAllowedError,
  QueryValidationError,
  RequestBodyValidationError,
  ValidationError,
} from './errors';
import { getUser, Permission, User } from './user';

export function buildHttpTriggerFunction<
  B extends ZodObject<ZodRawShape, 'strict'> | ZodEffects<ZodObject<ZodRawShape, 'strict'>> | ZodArray<ZodTypeAny>,
  Q extends ZodObject<ZodRawShape>
>(
  callback: (
    context: Context,
    req: HttpRequest,
    info: {
      user: User;
      requestBody: TypeOf<B>;
      query: TypeOf<Q>;
    }
  ) => Promise<HttpResponse> | HttpResponse,
  meta?: {
    requiredPermissions?: Permission[];
    requestBodySchema?: B;
    querySchema?: Q;
  }
): AzureFunction {
  return async function (context: Context, req: HttpRequest): Promise<HttpResponse> {
    try {
      const user = await getUser(req);

      if (meta?.requiredPermissions && !meta.requiredPermissions.some(user.permissions.includes)) {
        const missingPermissions = meta.requiredPermissions.filter((p) => !user.permissions.includes(p));
        throw new NotAllowedError(missingPermissions);
      }

      if (meta?.requestBodySchema && !req.body) {
        throw new ValidationError('Missing request body');
      }

      let requestBody: TypeOf<B> | undefined;
      try {
        requestBody = meta?.requestBodySchema?.parse(req.body);
      } catch (err) {
        if (err instanceof ZodError) {
          throw new RequestBodyValidationError(err);
        } else {
          throw err;
        }
      }

      let query: TypeOf<Q> | undefined;
      try {
        query = meta?.querySchema?.strict().parse(req.query ?? {});
      } catch (err) {
        if (err instanceof ZodError) {
          throw new QueryValidationError(err);
        } else {
          throw err;
        }
      }

      return await callback(context, req, {
        user,
        // body and query can be undefined, but this makes it more convenient to use
        requestBody: requestBody ?? {},
        query: query ?? {},
      });
    } catch (err) {
      if (err instanceof HttpError) {
        return {
          status: err.statusCode,
          body: err.message,
        };
      }
      context.log.error(err);
      return {
        status: 500,
        body: 'Internal server error',
      };
    }
  };
}
