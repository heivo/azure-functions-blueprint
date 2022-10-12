import { z } from 'zod';
import { createAsset } from '../utils/asset';
import { buildHttpTriggerFunction } from '../utils/function';
import { Permission } from '../utils/user';

export const requiredPermissions: Permission[] = ['create_asset'];

export const requestBodySchema = z
  .object({
    name: z.string().trim().min(3),
    serial: z.string().optional(),
  })
  .strict();

export default buildHttpTriggerFunction(
  async (ctx, req, { user, requestBody: { name, serial } }) => {
    ctx.log(`User ${user.username} is creating new asset: name="${name}", serial="${serial ?? '-'}"`);
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
