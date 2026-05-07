import yaml from 'js-yaml';
import enRaw from '../data/tiles/v1_en.yaml?raw';
import nlRaw from '../data/tiles/v1_nl.yaml?raw';
import zhRaw from '../data/tiles/v1_zh.yaml?raw';

export type TileStatus = 'empty' | 'filled' | 'hazard' | 'reserved';

export interface Tile {
  status?: TileStatus;
  hazard_type?: string;
  mechanic_label?: string;
  title?: string;
  body?: string;
  icon?: string;
}

export type TileMap = Record<string, Tile>;

export const tilesEn = yaml.load(enRaw) as TileMap;
export const tilesNl = yaml.load(nlRaw) as TileMap;
export const tilesZh = yaml.load(zhRaw) as TileMap;

export function getTiles(lang: 'en' | 'nl' | 'zh'): TileMap {
  if (lang === 'nl') return tilesNl;
  if (lang === 'zh') return tilesZh;
  return tilesEn;
}
