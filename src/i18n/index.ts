import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { nl } from './nl';
import { en } from './en';

const deviceLanguage = Localization.getLocales()?.[0]?.languageCode ?? 'nl';

i18n.use(initReactI18next).init({
  resources: {
    nl: { translation: nl },
    en: { translation: en },
  },
  lng: deviceLanguage === 'en' ? 'en' : 'nl',
  fallbackLng: 'nl',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
