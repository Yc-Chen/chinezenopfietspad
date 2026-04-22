import en from '../i18n/en.json';
import nl from '../i18n/nl.json';

export type Lang = 'en' | 'nl';
export type I18nBundle = typeof en;

const bundles: Record<Lang, I18nBundle> = { en, nl };

export function getI18n(lang: Lang): I18nBundle {
  return bundles[lang];
}
