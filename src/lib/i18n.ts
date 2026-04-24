import en from '../i18n/en.json';
import nl from '../i18n/nl.json';
import zh from '../i18n/zh.json';

export type Lang = 'en' | 'nl' | 'zh';
export type I18nBundle = typeof en;

const bundles: Record<Lang, I18nBundle> = { en, nl, zh };

export function getI18n(lang: Lang): I18nBundle {
  return bundles[lang];
}
