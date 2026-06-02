// Highcharts has its own internal language tables for weekday/month names —
// they are NOT derived from dayjs. xAxis date labels and any %a/%b/%A/%B
// format tokens read from `lang`, so it must be configured per-locale.
// `lang` is global in Highcharts and must be applied via `setOptions` before
// charts render.

type HighchartsLang = {
  weekdays: string[];
  shortWeekdays: string[];
  months: string[];
  shortMonths: string[];
};

const EN: HighchartsLang = {
  weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortWeekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const ES: HighchartsLang = {
  weekdays: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  shortWeekdays: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
  months: [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ],
  shortMonths: [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sept",
    "oct",
    "nov",
    "dic",
  ],
};

export function getHighchartsLang(locale: string): HighchartsLang {
  return locale?.startsWith("es") ? ES : EN;
}
