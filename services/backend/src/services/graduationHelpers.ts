import moment from 'moment'
import { Op } from 'sequelize'

import { Semester, SemesterEnrollment, Studyright } from '../models'
import { ExtentCode } from '../types/extentCode'

interface Absence {
  semesterCode: string
  startDate: Date
  endDate: Date
}

export const countTimeCategories = (times: number[], goal: number) => {
  const statistics = { onTime: 0, yearOver: 0, wayOver: 0 }
  times.forEach(time => {
    if (time <= goal) {
      statistics.onTime += 1
    } else if (time <= goal + 12) {
      statistics.yearOver += 1
    } else {
      statistics.wayOver += 1
    }
  })
  return statistics
}

export const getBachelorStudyRight = async (id: string) => {
  return await Studyright.findOne({
    attributes: ['startdate'],
    where: {
      studyrightid: id,
      extentcode: ExtentCode.BACHELOR,
    },
  })
}

const mapAbsence = (absence: any): Absence => {
  return {
    semesterCode: absence.semestercode,
    startDate: absence.semester.startdate,
    endDate: absence.semester.enddate,
  }
}

const statutoryAbsences = async (studentNumber: string, startDate: Date, endDate: Date) =>
  (
    await SemesterEnrollment.findAll({
      attributes: ['semestercode'],
      include: {
        model: Semester,
        attributes: ['startdate', 'enddate'],
        where: {
          startdate: {
            [Op.gte]: startDate,
          },
          enddate: {
            [Op.lte]: endDate,
          },
        },
      },
      where: {
        studentnumber: studentNumber,
        statutory_absence: true,
      },
    })
  ).map(mapAbsence)

export const getStatutoryAbsences = async (studentNumber: string, startDate: Date, endDate: Date): Promise<number> => {
  const absences = await statutoryAbsences(studentNumber, startDate, endDate)
  if (!absences.length) {
    return 0
  }
  const absentMonths = absences.reduce(
    (sum, absence) => sum + moment(absence.endDate).diff(moment(absence.startDate), 'months'),
    0
  )
  return absentMonths
}
