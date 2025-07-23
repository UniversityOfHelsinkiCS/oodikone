export const dayInMilliseconds = 24 * 60 * 60 * 1000

/**
 * @returns A new date with year incremented by the given amount
 */
export const dateYearsFromNow = (date: Date, years: number) => {
  const newDate = new Date(date)
  newDate.setFullYear(newDate.getFullYear() + years)
  return newDate
}

/**
 * @param date The initial Date as ISOString
 * @param months Number of months to add to the start date
 * @returns A new date with months incremented by the given amount
 */
export const dateMonthsFromNow = (date: string, months?: string) => {
  const initialDate = new Date(date)
  // NOTE: Cast to number, uses "MAGIC_NUMBER" if undefined or NaN
  const acualMonths = +(months ?? NaN) || 10000
  return new Date(initialDate.setMonth(initialDate.getMonth() + acualMonths))
}

/**
 * @returns A new Date with amount of days added to the start date
 */
export const dateDaysFromNow = (date: Date, days: number) => new Date(date.getTime() + dayInMilliseconds * days)

/**
 * @returns Smallest Date object, or undefined if dates is empty
 */
export const dateMinFromList = (...dates: Date[]): Date | undefined => {
  return dates.reduce((minDate, currDate) => {
    return !!currDate && currDate < minDate ? currDate : minDate
  }, dates.shift()!)
}

/**
 * @returns Largest Date object, or undefined if dates is empty
 */
export const dateMaxFromList = (...dates: Date[]): Date | undefined => {
  return dates.reduce((maxDate, currDate) => {
    return !!currDate && currDate > maxDate ? currDate : maxDate
  }, dates.shift()!)
}

/**
 * @returns boolean on whether the date is between start and end dates
 */
export const dateIsBetween = (date: Date, startDate: Date, endDate: Date) => {
  return startDate < date && date < endDate
}
