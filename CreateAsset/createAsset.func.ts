import { buildHttpTriggerFunction } from '../utils/function';
import { createAsset } from '../utils/asset';
import { Permission } from '../utils/user';
import requestBodySchema from './requestBodySchema';

export const requiredPermissions: Permission[] = ['create_asset'];

export default buildHttpTriggerFunction(
  async (ctx, req, { user, requestBody: { name, serial } }) => {
    ctx.log(`User ${user.username} is creating new asset: name=${name}, serial=${serial ?? '<undefined>'}`);
    const asset = await createAsset({ name, serial });
    return {
      status: 201,
      body: asset,
    };
  },
  {
    requiredPermissions,
    requestBodySchema,
  }
);
