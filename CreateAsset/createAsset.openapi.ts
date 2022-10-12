import { OpenApiSpec } from '../openapi/types';
import { assetSchema } from '../utils/asset';
import { requiredPermissions } from './createAsset.func';
import requestBodySchema from './requestBodySchema';

const spec: OpenApiSpec = {
  tag: 'Assets',
  summary: 'Create a new asset',
  description: 'Creates a new asset in the database',
  requestBody: requestBodySchema,
  responses: {
    201: {
      description: 'Asset was successfully created',
      schema: assetSchema,
    },
  },
  requiredPermissions: requiredPermissions,
};

export default spec;
