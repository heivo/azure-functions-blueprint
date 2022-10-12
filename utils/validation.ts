import { z, ZodBoolean, ZodDefault, ZodNumber } from 'zod';

export function preprocessStringToBoolean(booleanSchema: ZodBoolean | ZodDefault<ZodBoolean> = z.boolean()) {
  return z.preprocess((arg) => {
    if (arg === 'true') {
      return true;
    }
    if (arg === 'false') {
      return false;
    }
    return arg;
  }, booleanSchema);
}

export function preprocessStringToNumber(numberSchema: ZodNumber | ZodDefault<ZodNumber> = z.number()) {
  return z.preprocess((arg) => {
    const numeric = Number(arg);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
    return arg;
  }, numberSchema);
}
