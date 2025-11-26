import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        "test": "This is a test string",
      },
    },
    de: {
      translation: {
        "test": "Das ist ein Teststring",
      },
    },
    es: {
      translation: {
        "test": "Esta es una cadena de prueba",
      },
    },
  },
  lng: "en", // if you're using a language detector, do not define the lng option
  fallbackLng: "en",

  interpolation: {
    escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
  },
});
