import { InferAttributes, Op, WhereOptions } from 'sequelize'

import { EnrollmentState, ExtentCode } from '@oodikone/shared/types'
import { CourseModel, CreditModel, EnrollmentModel, StudentModel, SISStudyRightModel } from '../../models'
import { OpenUniPopulationSearchModel } from '../../models/kone'
import { formatCourseInfo, formatOpenCredits, formatOpenEnrollments, formatStudentInfo } from './format'

export const getCredits = async (courseCodes: string[], startdate: Date) =>
  (
    await CreditModel.findAll({
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
    await StudentModel.findAll({
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
    await EnrollmentModel.findAll({
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
        state: EnrollmentState.ENROLLED,
      },
    })
  ).map(formatOpenEnrollments)

export const getCourseNames = async (courseCodes: string[]) =>
  (
    await CourseModel.findAll({
      attributes: ['code', 'name'],
      where: {
        code: {
          [Op.in]: courseCodes,
        },
      },
    })
  ).map(formatCourseInfo)

export const getStudyRights = async (studentNumbers: string[]) => {
  const where: WhereOptions<InferAttributes<SISStudyRightModel>> = {
    extentCode: {
      [Op.in]: [
        ExtentCode.BACHELOR,
        ExtentCode.BACHELOR_AND_MASTER,
        ExtentCode.MASTER,
        ExtentCode.LICENTIATE,
        ExtentCode.DOCTOR,
      ],
    },
  }

  if (studentNumbers.length > 0) {
    where.studentNumber = {
      [Op.in]: studentNumbers,
    }
  }

  return await SISStudyRightModel.findAll({
    attributes: ['startDate', 'endDate', 'studentNumber'],
    where,
  })
}

export const getOpenUniSearchesByUser = async (userId: string) => {
  return await OpenUniPopulationSearchModel.findAll({
    where: {
      userId,
    },
  })
}

export const createOpenUniPopulationSearch = async (userId: string, name: string, courseCodes: string[]) => {
  return await OpenUniPopulationSearchModel.create({
    userId,
    name,
    courseCodes,
  })
}

export const updateOpenUniPopulationSearch = async (userId: string, id: string, courseCodes: string[]) => {
  const searchToUpdate = await OpenUniPopulationSearchModel.findOne({
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

export const deleteOpenUniSearch = async (userId: string, id: string) => {
  return await OpenUniPopulationSearchModel.destroy({
    where: {
      userId,
      id,
    },
  })
}
