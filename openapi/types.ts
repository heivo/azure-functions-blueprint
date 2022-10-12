import type { HeaderObject } from 'openapi3-ts';
import type { Required } from 'utility-types';
import type { ZodArray, ZodObject, ZodRawShape, ZodString, ZodTypeAny } from 'zod';
import { Permission } from '../utils/user';

type Tag = 'Assets';

export interface OpenApiSpec {
  tag: Tag;
  summary: string;
  description: string;
  params?: { [key: string]: ZodString };
  query?: ZodObject<ZodRawShape>;
  requestBody?: ZodObject<ZodRawShape, 'strict'> | ZodArray<ZodTypeAny>;
  responses: {
    [statusCode: string]: {
      description: string;
      schema?: ZodObject<ZodRawShape> | ZodArray<ZodTypeAny>;
      headers?: { [name: string]: Required<HeaderObject, 'description' | 'schema'> };
    };
  };
  requiredPermissions?: Permission[];
}
