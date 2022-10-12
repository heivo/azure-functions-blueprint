import { z } from 'zod';
import { randomUUID } from 'crypto';

import { registry } from './registry';

export const assetIdParam = registry.registerParameter(
  'AssetId',
  z
    .string()
    .uuid()
    .openapi({
      param: {
        name: 'id',
        in: 'path',
        description: 'The ID of the asset',
      },
      example: randomUUID(),
    })
);
