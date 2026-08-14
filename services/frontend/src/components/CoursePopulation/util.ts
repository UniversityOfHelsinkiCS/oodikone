import { SemestersData } from '@/hooks/useSemesters'

export const getFromToDates = (
  from: number,
  to: number,
  separate: boolean,
  semesters: SemestersData['semesters'],
  semesterYears: SemestersData['years']
) => {
  const dataValues = separate ? Object.values(semesters) : Object.values(semesterYears)

  const key = separate ? 'semestercode' : 'yearcode'

  const findDateByCode = (code: number) => dataValues.find(item => item[key] === code)

  return {
    dateFrom: findDateByCode(Number(from))?.startdate,
    dateTo: findDateByCode(Number(to))?.enddate,
  }
}
