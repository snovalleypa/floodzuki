// This is needed to support calls to startOf and endOf in day.js with timezone plugin enabled
import "@formatjs/intl-getcanonicallocales/polyfill";
import "@formatjs/intl-locale/polyfill";

import "@formatjs/intl-displaynames/polyfill";
import "@formatjs/intl-displaynames/locale-data/en"; // locale-data for en

import "@formatjs/intl-listformat/polyfill";
import "@formatjs/intl-listformat/locale-data/en"; // locale-data for en

import "@formatjs/intl-pluralrules/polyfill";
import "@formatjs/intl-pluralrules/locale-data/en"; // locale-data for en

import "@formatjs/intl-numberformat/polyfill";
import "@formatjs/intl-numberformat/locale-data/en"; // locale-data for en

import "@formatjs/intl-relativetimeformat/polyfill";
import "@formatjs/intl-relativetimeformat/locale-data/en"; // locale-data for en

import "@formatjs/intl-datetimeformat/polyfill";
import "@formatjs/intl-datetimeformat/locale-data/en"; // locale-data for en
import "@formatjs/intl-datetimeformat/add-all-tz"; // Add ALL tz data

import "expo-router/entry";
