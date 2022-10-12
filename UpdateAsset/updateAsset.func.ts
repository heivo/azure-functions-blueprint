import { buildHttpTriggerFunction } from '../utils/function';
import { updateAsset } from '../utils/asset';
import { Permission } from '../utils/user';
import requestBodySchema from './requestBodySchema';

export const requiredPermissions: Permission[] = ['create_asset'];

export default buildHttpTriggerFunction(
  async (ctx, req, { user, requestBody: { name, serial } }) => {
    const { id } = req.params;
    ctx.log(`User ${user.username} is updating asset ${id}: name=${name}, serial=${serial ?? '<undefined>'}`);
    const asset = await updateAsset(id, { name, serial });
    return {
      status: 200,
      body: asset,
    };
  },
  {
    requiredPermissions,
    requestBodySchema,
  }
);
