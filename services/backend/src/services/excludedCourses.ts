import { Op } from 'sequelize'

import { ExcludedCourse } from '../models/kone'

export const addExcludedCourses = async (courseCodes: string[], curriculumVersion: string, programmeCode: string) => {
  return ExcludedCourse.bulkCreate(
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
  return ExcludedCourse.destroy({
    where: {
      programme_code: programmeCode,
      curriculum_version: curriculumVersion,
      course_code: { [Op.in]: courseCodes },
    },
  })
}
