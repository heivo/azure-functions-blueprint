import { z } from 'zod';
import { countAssets, createAsset, listAssets } from '../utils/asset';
import { buildHttpTriggerFunction } from '../utils/function';
import { Permission } from '../utils/user';
import { preprocessStringToBoolean, preprocessStringToNumber } from '../utils/validation';

export const requiredPermissions: Permission[] = ['read_asset'];

export const querySchema = z.object({
  skip: preprocessStringToNumber(z.number().int().min(0).default(0)),
  take: preprocessStringToNumber(z.number().int().positive().default(20)),
  name: z.string().optional(),
  hasSerial: preprocessStringToBoolean().optional(),
});

export default buildHttpTriggerFunction(
  async (ctx, req, { query: { skip, take, name, hasSerial } }) => {
    const filter = { name, hasSerial };
    const [assets, totalCount] = await Promise.all([listAssets(skip, take, filter), countAssets(filter)]);
    return {
      status: 201,
      body: assets,
      headers: {
        'x-total-count': totalCount.toString(),
      },
    };
  },
  {
    requiredPermissions,
    querySchema,
  }
);
