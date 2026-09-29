import { Op } from 'sequelize'

import { ExcludedCourseModel } from '../models/kone'

export const addExcludedCourses = async (
  courseGroupIds: string[],
  curriculumVersion: string,
  programmeCode: string
) => {
  const existing = await ExcludedCourseModel.findAll({
    attributes: ['course_group_id'],
    where: {
      programme_code: programmeCode,
      curriculum_version: curriculumVersion,
      course_group_id: { [Op.in]: courseGroupIds },
    },
    raw: true,
  })
  const alreadyExcluded = new Set(existing.map(({ course_group_id }) => course_group_id))

  return ExcludedCourseModel.bulkCreate(
    courseGroupIds
      .filter(courseGroupId => !alreadyExcluded.has(courseGroupId))
      .map(courseGroupId => ({
        programme_code: programmeCode,
        curriculum_version: curriculumVersion,
        course_group_id: courseGroupId,
      }))
  )
}

export const removeExcludedCourses = async (
  courseGroupIds: string[],
  curriculumVersion: string,
  programmeCode: string
) => {
  return ExcludedCourseModel.destroy({
    where: {
      programme_code: programmeCode,
      curriculum_version: curriculumVersion,
      course_group_id: { [Op.in]: courseGroupIds },
    },
  })
}
