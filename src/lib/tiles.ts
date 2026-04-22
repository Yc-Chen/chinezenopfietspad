import yaml from 'js-yaml';
import enRaw from '../data/tiles/v1_en.yaml?raw';
import nlRaw from '../data/tiles/v1_nl.yaml?raw';

export type TileStatus = 'empty' | 'filled' | 'hazard' | 'reserved';

export interface Tile {
  status?: TileStatus;
  suit?: string | null;
  hazard_type?: string;
  title?: string;
  body?: string;
  icon?: string;
  did_you_know?: string | null;
}

export type TileMap = Record<string, Tile>;

export const tilesEn = yaml.load(enRaw) as TileMap;
export const tilesNl = yaml.load(nlRaw) as TileMap;

export function getTiles(lang: 'en' | 'nl'): TileMap {
  return lang === 'nl' ? tilesNl : tilesEn;
}
