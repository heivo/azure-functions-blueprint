import { buildHttpTriggerFunction } from '../utils/function';
import { countAssets, listAssets } from '../utils/asset';
import { Permission } from '../utils/user';
import querySchema from './querySchema';

export const requiredPermissions: Permission[] = ['read_asset'];

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
