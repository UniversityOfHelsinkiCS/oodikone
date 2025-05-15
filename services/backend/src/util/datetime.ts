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
export const dateDaysFromNow = (date: Date, days: number) => new Date(date.getTime() + 24 * 60 * 60 * 1000 * days)

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

type DiffUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'

/**
 * @returns calculations based on moment().diff(), which isn't perfect but the tests should be happy...
 */
export const dateDiff = (a: Date, b: Date, unit: DiffUnit) => {
  const ms = Math.abs(a.getTime() - b.getTime())

  const lastDateOfTheMonth = new Date(a.getFullYear(), a.getMonth(), 0).getDate()
  const years = a.getFullYear() - b.getFullYear()
  const months = a.getMonth() - b.getMonth()

  const fraction = (a.getDate() - b.getDate()) / lastDateOfTheMonth

  switch (unit) {
    case 'milliseconds':
      return ms
    case 'seconds':
      return ms / 1000
    case 'minutes':
      return ms / (1000 * 60)
    case 'hours':
      return ms / (1000 * 60 * 60)
    case 'days':
      return ms / (1000 * 60 * 60 * 24)
    case 'months':
      return years * 12 + months + fraction
    case 'years':
      return years + months / 12 + fraction / 365.25
  }
}
