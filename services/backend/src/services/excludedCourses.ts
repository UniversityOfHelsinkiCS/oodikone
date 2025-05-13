import { Op } from 'sequelize'

import { ExcludedCourseModel } from '../models/kone'

export const addExcludedCourses = async (courseCodes: string[], curriculumVersion: string, programmeCode: string) => {
  return ExcludedCourseModel.bulkCreate(
    courseCodes.map(courseCode => ({
      programme_code: programmeCode,
      curriculum_version: curriculumVersion,
      course_code: courseCode,
    }))
  )
}

export const removeExcludedCourses = async (
  courseCodes: string[],
  curriculumVersion: string,
  programmeCode: string
) => {
  return ExcludedCourseModel.destroy({
    where: {
      programme_code: programmeCode,
      curriculum_version: curriculumVersion,
      course_code: { [Op.in]: courseCodes },
    },
  })
}
