import moment from 'moment'
import { Op } from 'sequelize'

import { Semester } from '../models'
import { Name } from '../types'

type SemestersAndYears = {
  years: {
    [yearcode: string]: { yearcode: number; yearname: string; startdate: moment.Moment; enddate: moment.Moment }
  }
  semesters: {
    [semestercode: string]: { semestercode: number; name: Name; yearcode: number; startdate: Date; enddate: Date }
  }
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
  const result = semesters.reduce(
    (acc, semester) => {
      const { semestercode, name, yearcode, yearname, startdate, enddate } = semester
      acc.semesters[semestercode] = { semestercode, name, yearcode, startdate, enddate }
      if (!acc.years[yearcode]) {
        acc.years[yearcode] = {
          yearcode,
          yearname,
          startdate: moment(startdate),
          enddate: moment(enddate),
        }
      } else {
        acc.years[yearcode] = {
          yearcode,
          yearname,
          startdate: moment.min(acc.years[yearcode].startdate, moment(startdate)),
          enddate: moment.max(acc.years[yearcode].enddate, moment(enddate)),
        }
      }
      return acc
    },
    { years: {}, semesters: {} } as SemestersAndYears
  )
  return result
}
