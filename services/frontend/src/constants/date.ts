// TODO: switch to enum and ditch moment library
export const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY'
export const DISPLAY_DATETIME_FORMAT = 'DD.MM.YYYY HH:mm'
export const DISPLAY_DATE_FORMAT_DEV = 'DD.MM.YYYY HH:mm:ss'
export const LONG_DATE_TIME_FORMAT = 'D MMMM YYYY [at] HH:mm:ss'
export const ISO_DATE_FORMAT = 'YYYY-MM-DD'
export const ISO_DATE_FORMAT_DEV = 'YYYY-MM-DD HH:mm:ss'
export const YEAR_DATE_FORMAT = 'YYYY'

export enum DateFormat {
  DISPLAY_DATE = 'DD.MM.YYYY',
  DISPLAY_DATETIME = 'DD.MM.YYYY HH:mm',
  DISPLAY_DATE_DEV = 'DD.MM.YYYY HH:mm:ss',
  LONG_DATE_TIME = 'D MMMM YYYY [at] HH:mm:ss',
  ISO_DATE = 'YYYY-MM-DD',
  ISO_DATE_DEV = 'YYYY-MM-DD HH:mm:ss',
  YEAR_DATE = 'YYYY',
}
