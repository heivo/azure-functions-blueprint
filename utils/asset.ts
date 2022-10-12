import { randomUUID } from 'crypto';
import { z } from 'zod';
import { registry } from '../openapi/registry';
import { NotFoundError } from './errors';

export const assetSchema = registry.register(
  'Asset',
  z.object({
    id: z.string().uuid().openapi({ example: randomUUID() }),
    name: z.string().openapi({ example: 'My asset' }),
    serial: z.string().optional().openapi({ example: 'A012345' }),
  })
);

export type Asset = z.infer<typeof assetSchema>;

const assets: Asset[] = [];

export async function createAsset(data: Omit<Asset, 'id'>): Promise<Asset> {
  const asset: Asset = { ...data, id: randomUUID() };
  assets.push(asset);
  return asset;
}

export async function updateAsset(id: string, data: Omit<Asset, 'id'>): Promise<Asset> {
  const asset = assets.find((a) => a.id === id);
  if (!asset) {
    throw new NotFoundError('Asset not found');
  }
  asset.name = data.name;
  asset.serial = data.serial;
  return asset;
}

interface Filter {
  name?: string;
  hasSerial?: boolean;
}

export async function listAssets(skip: number, take: number, filter: Filter): Promise<Asset[]> {
  return assets
    .filter(filterPredicate(filter))
    .sort((a1, a2) => a1.name.localeCompare(a2.name))
    .slice(skip, skip + take);
}

export async function countAssets(filter: Filter): Promise<number> {
  return assets.filter(filterPredicate(filter)).length;
}

function filterPredicate(filter: Filter): (asset: Asset) => boolean {
  return (asset: Asset) => {
    if (filter.name !== undefined && !asset.name.toLowerCase().includes(filter.name)) {
      return false;
    }
    if (filter.hasSerial !== undefined) {
      return !!asset.serial === filter.hasSerial;
    }
    return true;
  };
}
