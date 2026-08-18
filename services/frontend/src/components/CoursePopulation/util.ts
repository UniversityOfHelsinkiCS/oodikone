import { SemestersData } from '@/hooks/useSemesters'
import { FormattedStudent } from '@oodikone/shared/types'
import { findCorrectProgramme } from '../PopulationComponents/ProgrammeDist/util'
import { GetTextIn } from '../LanguagePicker/useLanguage'

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

export const getStudentRelevantProgrammes =
  (
    courseIds: string[],
    allSemesters: any,
    dateFrom: string,
    dateTo: string,
    semesterCode: number,
    getTextIn: GetTextIn
  ) =>
  (students: FormattedStudent[]) => {
    return students.reduce<Map<string, string>>((programmes, student) => {
      const programme = findCorrectProgramme(
        student,
        courseIds,
        allSemesters,
        new Date(dateFrom),
        new Date(dateTo),
        semesterCode
      )

      programmes.set(student.studentNumber, getTextIn(programme.name) ?? '')
      return programmes
    }, new Map())
  }
