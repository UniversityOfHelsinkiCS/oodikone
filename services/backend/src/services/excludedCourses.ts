import { Op } from 'sequelize'

import { CourseModel } from '../models'
import { ExcludedCourseModel } from '../models/kone'
import logger from '../util/logger'

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

/**
 * Fills course_group_id for rows that only have the legacy course_code. Safe to run repeatedly.
 * Rows whose code cannot be found in the course table are left untouched and reported.
 */
export const backfillExcludedCourseGroupIds = async () => {
  const legacyRows = await ExcludedCourseModel.findAll({
    attributes: ['course_code'],
    where: { course_group_id: null, course_code: { [Op.ne]: null } },
    group: ['course_code'],
    raw: true,
  })
  if (legacyRows.length === 0) return

  const courseCodes = legacyRows.map(({ course_code }) => course_code!)
  const courses = await CourseModel.findAll({
    attributes: ['code', 'groupId'],
    where: { code: { [Op.in]: courseCodes } },
    raw: true,
  })
  const groupIdByCode = new Map(courses.map(({ code, groupId }) => [code, groupId]))

  let updated = 0
  for (const courseCode of courseCodes) {
    const groupId = groupIdByCode.get(courseCode)
    if (!groupId) continue
    const [count] = await ExcludedCourseModel.update(
      { course_group_id: groupId },
      { where: { course_code: courseCode, course_group_id: null } }
    )
    updated += count
  }

  const unmapped = courseCodes.filter(code => !groupIdByCode.has(code))
  logger.info(`Backfilled course_group_id for ${updated} excluded courses`)
  if (unmapped.length > 0) {
    logger.warn(`Could not find a course group id for excluded course codes: ${unmapped.join(', ')}`)
  }
}
