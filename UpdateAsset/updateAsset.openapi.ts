import requestBodySchema from '../CreateAsset/requestBodySchema';
import { assetIdParam } from '../openapi/params';
import { OpenApiSpec } from '../openapi/types';
import { assetSchema } from '../utils/asset';
import { requiredPermissions } from './updateAsset.func';

const spec: OpenApiSpec = {
  tag: 'Assets',
  summary: 'Update an existing asset',
  description: 'Updates an existing asset in the database',
  params: {
    id: assetIdParam,
  },
  requestBody: requestBodySchema,
  responses: {
    200: {
      description: 'Asset was successfully updated',
      schema: assetSchema,
    },
  },
  requiredPermissions: requiredPermissions,
};

export default spec;
