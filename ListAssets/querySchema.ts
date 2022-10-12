import { z } from 'zod';
import { preprocessStringToBoolean, preprocessStringToNumber } from '../utils/validation';

export default z.object({
  skip: preprocessStringToNumber(z.number().int().min(0).default(0)).openapi({
    default: 0,
    param: { description: 'Pagination: skip n entries' },
  }),
  take: preprocessStringToNumber(z.number().int().positive().default(20)).openapi({
    default: 20,
    param: { description: 'Pagination: take n entries' },
  }),
  name: z
    .string()
    .optional()
    .openapi({ param: { description: 'Filter assets by name' } }),
  hasSerial: preprocessStringToBoolean()
    .optional()
    .openapi({ param: { description: 'Filter assets that have a serial number or not' } }),
});
