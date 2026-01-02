import { Op } from 'sequelize'

import { Name } from '@oodikone/shared/types'
import { dateMinFromList, dateMaxFromList } from '@oodikone/shared/util/datetime'
import { SemesterModel } from '../models'

type SemestersAndYears = {
  years: Record<
    string,
    {
      yearcode: number
      yearname: string
      startdate: Date
      enddate: Date
    }
  >
  semesters: Record<
    string,
    {
      semestercode: number
      name: Name
      yearcode: number
      startdate: Date
      enddate: Date
    }
  >
}

export const getSemesterNamesByCode = async (semesterCodes: number[]): Promise<Record<number, Name>> => {
  const semesters = await SemesterModel.findAll({
    attributes: ['name', 'semestercode'],
    where: {
      semestercode: { [Op.in]: semesterCodes },
    },
    raw: true,
  })

  return Object.fromEntries(semesters.map(({ name, semestercode }) => [semestercode, name]))
}

export const getCurrentSemester = async () => {
  const today = new Date()
  const currentSemester = await SemesterModel.findOne({
    where: {
      startdate: {
        [Op.lte]: today,
      },
      enddate: {
        [Op.gte]: today,
      },
    },
  })
  return currentSemester!
}

export const getSemestersAndYears = async () => {
  const semesters = await SemesterModel.findAll()
  return semesters.reduce(
    (acc, semester) => {
      const { semestercode, name, yearcode, yearname, startdate, enddate } = semester
      acc.semesters[semestercode] = { semestercode, name, yearcode, startdate, enddate }
      acc.years[yearcode] = {
        yearcode,
        yearname,
        startdate: dateMinFromList(startdate, acc.years[yearcode]?.startdate)!,
        enddate: dateMaxFromList(enddate, acc.years[yearcode]?.enddate)!,
      }

      return acc
    },
    { years: {}, semesters: {} } as SemestersAndYears
  )
}
