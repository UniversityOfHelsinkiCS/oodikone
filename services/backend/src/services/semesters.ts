import { Op } from 'sequelize'

import { Name } from '@oodikone/shared/types'
import { Semester } from '../models'
import { dateMinFromList, dateMaxFromList } from '../util/datetime'

type SemestersAndYears = {
  years: {
    [yearcode: string]: {
      yearcode: number
      yearname: string
      startdate: Date
      enddate: Date
    }
  }
  semesters: {
    [semestercode: string]: {
      semestercode: number
      name: Name
      yearcode: number
      startdate: Date
      enddate: Date
    }
  }
}

export const getSemesterNameByCode = async (semesterCode: number) => {
  const semester = await Semester.findOne({
    attributes: ['name'],
    where: {
      semestercode: semesterCode,
    },
  })
  return semester!
}

export const getCurrentSemester = async () => {
  const today = new Date()
  const currentSemester = await Semester.findOne({
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
  const semesters = await Semester.findAll()
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
