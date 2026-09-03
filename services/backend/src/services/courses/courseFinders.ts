import { col, fn, Op, QueryTypes } from 'sequelize'

import { CourseWithSubsDetails } from '@oodikone/shared/types/course'
import { CourseModel } from '../../models'
import { dbConnections } from '../../database/connection'

const likeTerm = (userInput: string, type: 'name' | 'code') => {
  const searchTerm = userInput.trim().replace(/[\\%_]/g, '')
  if (!searchTerm) return undefined

  return type === 'name'
    ? {
        name: {
          [Op.or]: {
            fi: {
              [Op.iLike]: `%${searchTerm}%`,
            },
            sv: {
              [Op.iLike]: `%${searchTerm}%`,
            },
            en: {
              [Op.iLike]: `%${searchTerm}%`,
            },
          },
        },
      }
    : {
        code: {
          [Op.iLike]: `${searchTerm}%`,
        },
      }
}

export const getCoursesByNameAndOrCode = async (name: string, code: string): Promise<CourseWithSubsDetails[]> => {
  // Get groupIds for the course units (CU) the user is querying
  // This step allows users to search with old or upcoming course codes and names
  // Example: searching for GEOK_2011 (old code) returns results for GEOK2011 (new code)
  const groupIds = (
    await CourseModel.findAll({
      attributes: [[fn('DISTINCT', col('group_id')), 'groupId']],
      where: {
        ...likeTerm(name, 'name'),
        ...likeTerm(code, 'code'),
        groupId: { [Op.ne]: null },
      },
      raw: true,
    })
  ).map(({ groupId }) => groupId)

  if (!groupIds.length) return []

  // Gets name/code from the "primary" CU, and attainment dates from all CUs with the same groupId
  const primaryCourses = await dbConnections.sequelize.query<CourseModel>(
    `
      WITH filtered AS (
        SELECT *
        FROM course
        WHERE group_id IN (:groupIds)
      ),
      grouped AS (
        SELECT
          group_id,
          MIN(min_attainment_date) AS min_attainment_date,
          MAX(max_attainment_date) AS max_attainment_date
        FROM filtered
        GROUP BY group_id
      ),
      primary_course AS (
        SELECT code, name, group_id, substitution_groups
        FROM filtered
        where is_primary = true
      )
      SELECT
        g.group_id AS "groupId",
        g.min_attainment_date AS "minAttainmentDate",
        g.max_attainment_date AS "maxAttainmentDate",
        p.name,
        p.code,
        p.substitution_groups AS "substitutionGroups"
      FROM grouped g
      JOIN primary_course p
        ON p.group_id = g.group_id
    `,
    {
      replacements: {
        groupIds,
      },
      type: QueryTypes.SELECT,
    }
  )

  const substitutionGroupIds = [...new Set(primaryCourses.map(course => course.substitutionGroups).flat(2))]
  const substitutionCourses = substitutionGroupIds.length
    ? Object.groupBy(
        await CourseModel.findAll({
          attributes: ['name', 'groupId', 'code'],
          where: { groupId: { [Op.in]: substitutionGroupIds }, isPrimary: true },
          raw: true,
        }),
        ({ groupId }) => groupId
      )
    : {}

  const coursesWithSubstitutionDetails = primaryCourses.map(course => ({
    ...course,
    // NOTE: There are some substitutions that just don't exist in importer -> don't send undefined to client
    substitutionGroups:
      course.substitutionGroups
        ?.map(groupIds => groupIds.flatMap(groupId => substitutionCourses[groupId]).filter(sub => !!sub))
        .filter(group => group.length) ?? [],
  }))

  return coursesWithSubstitutionDetails
}

export const getCoursesByCodes = (codes: string[]) => {
  return CourseModel.findAll({
    where: {
      code: {
        [Op.in]: codes,
      },
    },
  })
}
