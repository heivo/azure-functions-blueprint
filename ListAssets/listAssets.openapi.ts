import { OpenApiSpec } from '../openapi/types';
import { assetSchema } from '../utils/asset';
import { requiredPermissions } from './listAssets.func';
import querySchema from './querySchema';

const spec: OpenApiSpec = {
  tag: 'Assets',
  summary: 'List assets',
  description: 'Lists assets with pagination and filter options',
  query: querySchema,
  responses: {
    200: {
      description: 'An array of assets',
      schema: assetSchema.array(),
      headers: {
        'x-total-count': {
          description: 'The total number of assets that match the filter',
          schema: {
            type: 'number',
          },
        },
      },
    },
  },
  requiredPermissions: requiredPermissions,
};

export default spec;
