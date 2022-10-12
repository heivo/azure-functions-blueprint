import { z } from 'zod';

export default z
  .object({
    name: z.string().trim().min(3).openapi({ example: 'My asset' }),
    serial: z.string().optional().openapi({ example: 'A012345' }),
  })
  .strict();
