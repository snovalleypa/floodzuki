/**
 * Add plugins to dayjs
 */

import dayjs from "dayjs"

import 'dayjs/locale/en';
import 'dayjs/locale/es';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'; // dependent on utc plugin
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(updateLocale)

dayjs.updateLocale('en', {
  months: [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"
  ]
})

dayjs.updateLocale('es', {
  months: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
    "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]
})

const localDayJs = dayjs

export default localDayJs
