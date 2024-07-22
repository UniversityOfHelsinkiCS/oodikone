import { Op } from 'sequelize'

import { ExcludedCourse } from '../models/kone'

export const addExcludedCourses = async (programmeCode: string, courseCodes: string[], curriculumVersion: string) => {
  return ExcludedCourse.bulkCreate(
    courseCodes.map(courseCode => ({
      programme_code: programmeCode,
      curriculum_version: curriculumVersion,
      course_code: courseCode,
    }))
  )
}

export const removeExcludedCourses = async (
  programmeCode: string,
  courseCodes: string[],
  curriculumVersion: string
) => {
  return ExcludedCourse.destroy({
    where: {
      programme_code: programmeCode,
      curriculum_version: curriculumVersion,
      course_code: { [Op.in]: courseCodes },
    },
  })
}
