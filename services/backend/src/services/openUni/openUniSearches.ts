import { Op } from 'sequelize'

import { Course, Credit, Enrollment, Student, SISStudyRight } from '../../models'
import { OpenUniPopulationSearch } from '../../models/kone'
import { ExtentCode } from '../../types'
import { formatCourseInfo, formatOpenCredits, formatOpenEnrollments, formatStudentInfo } from './format'

export const getCredits = async (courseCodes: string[], startdate: Date) =>
  (
    await Credit.findAll({
      attributes: ['attainment_date', 'course_code', 'grade', 'student_studentnumber'],
      where: {
        course_code: {
          [Op.in]: courseCodes,
        },
        attainment_date: {
          [Op.gte]: startdate,
        },
      },
    })
  ).map(formatOpenCredits)

export const getStudentInfo = async (studentNumbers: string[]) =>
  (
    await Student.findAll({
      attributes: ['studentnumber', 'email', 'secondary_email'],
      where: {
        studentnumber: {
          [Op.in]: studentNumbers,
        },
      },
    })
  ).map(formatStudentInfo)

export const getEnrollments = async (courseCodes: string[], startDate: Date, endDate: Date) =>
  (
    await Enrollment.findAll({
      attributes: ['course_code', 'enrollment_date_time', 'studentnumber'],
      where: {
        course_code: {
          [Op.in]: courseCodes,
        },
        is_open: true,
        enrollment_date_time: {
          [Op.and]: {
            [Op.lte]: endDate,
            [Op.gte]: startDate,
          },
        },
      },
    })
  ).map(formatOpenEnrollments)

export const getCourseNames = async (courseCodes: string[]) =>
  (
    await Course.findAll({
      attributes: ['code', 'name'],
      where: {
        code: {
          [Op.in]: courseCodes,
        },
      },
    })
  ).map(formatCourseInfo)

export const getStudyRights = async (studentNumbers: string[]) => {
  return await SISStudyRight.findAll({
    attributes: ['startDate', 'endDate', 'studentNumber'],
    where: {
      studentNumber: {
        [Op.in]: studentNumbers.length > 0 ? studentNumbers : { [Op.not]: null },
      },
      extentCode: {
        [Op.in]: [
          ExtentCode.BACHELOR,
          ExtentCode.BACHELOR_AND_MASTER,
          ExtentCode.MASTER,
          ExtentCode.LICENTIATE,
          ExtentCode.DOCTOR,
        ],
      },
    },
  })
}

export const getOpenUniSearchesByUser = async (userId: bigint) => {
  return await OpenUniPopulationSearch.findAll({
    where: {
      userId,
    },
  })
}

export const createOpenUniPopulationSearch = async (userId: bigint, name: string, courseCodes: string[]) => {
  return await OpenUniPopulationSearch.create({
    userId,
    name,
    courseCodes,
  })
}

export const updateOpenUniPopulationSearch = async (userId: bigint, id: bigint, courseCodes: string[]) => {
  const searchToUpdate = await OpenUniPopulationSearch.findOne({
    where: {
      userId,
      id,
    },
  })

  if (!searchToUpdate) {
    return null
  }

  return await searchToUpdate.update({ courseCodes })
}

export const deleteOpenUniSearch = async (userId: bigint, id: bigint) => {
  return await OpenUniPopulationSearch.destroy({
    where: {
      userId,
      id,
    },
  })
}
