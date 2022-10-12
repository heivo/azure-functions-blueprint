import { z } from 'zod';
import { createAsset, updateAsset } from '../utils/asset';
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
    const { id } = req.params;
    ctx.log(`User ${user.username} is updating asset ${id}: name="${name}", serial="${serial ?? '-'}"`);
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
