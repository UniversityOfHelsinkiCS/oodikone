import { Op, QueryTypes } from 'sequelize'

import { dbConnections } from '../database/connection'
import { CurriculumPeriod, ProgrammeModule } from '../models'
import { ExcludedCourse } from '../models/kone'
import { Name } from '../shared/types'
import logger from '../util/logger'
import { combinedStudyProgrammes } from './studyProgramme/studyProgrammeHelpers'

export const getCurriculumVersions = async (code: string) => {
  try {
    const result: Array<ProgrammeModule & { curriculumName?: string }> = await ProgrammeModule.findAll({
      where: { code },
      order: [['valid_from', 'DESC']],
      raw: true,
    })
    for (const curriculum of result) {
      const curriculumPeriods = await CurriculumPeriod.findAll({
        attributes: ['startDate', 'endDate'],
        where: {
          id: {
            [Op.in]: curriculum.curriculum_period_ids,
          },
        },
        raw: true,
      })
      const startYear = curriculumPeriods.map(({ startDate }) => startDate).sort((a, b) => a.getTime() - b.getTime())[0]
      const endYear = curriculumPeriods.map(({ endDate }) => endDate).sort((a, b) => b.getTime() - a.getTime())[0]
      curriculum.curriculumName = `${startYear.getFullYear()}–${endYear.getFullYear()}`
    }
    return result
  } catch (error) {
    logger.error(`Error when searching curriculum versions for code: ${code}`)
    logger.error(error)
    return null
  }
}

type ModuleWithChildren = Pick<
  ProgrammeModule,
  | 'id'
  | 'code'
  | 'name'
  | 'type'
  | 'order'
  | 'organization_id'
  | 'valid_from'
  | 'valid_to'
  | 'group_id'
  | 'curriculum_period_ids'
> & {
  parent_id: string
  created_at: Date
  updated_at: Date
  study_level: string | null
  degree_programme_type: string | null
  module_order: number | null
  parent_name: Name
  parent_code: string | null
}

const recursivelyGetModuleAndChildren = async (code: string, curriculum_period_ids: string[]) => {
  const connection = dbConnections.sequelize

  try {
    const result: ModuleWithChildren[] = await connection.query(
      `WITH RECURSIVE children as (
        SELECT DISTINCT pm.*, 0 AS module_order, NULL::jsonb AS parent_name, NULL AS parent_code, NULL as parent_id FROM programme_modules pm
        WHERE pm.code = ? AND ARRAY[?]::text[] && curriculum_period_ids
        UNION ALL
        SELECT pm.*, c.order AS module_order, c.name AS parent_name, c.code AS parent_code, c.id as parent_id
        FROM children c, programme_modules pm, programme_module_children pmc
        WHERE c.id = pmc.parent_id AND pm.group_id = pmc.child_id AND (ARRAY[?]::text[] && pm.curriculum_period_ids OR pm.type = 'course' OR pm.code is null)
        GROUP BY pm.id, c.name, c.code, c.order, c.id
      ) SELECT * FROM children`,
      { replacements: [code, curriculum_period_ids, curriculum_period_ids], type: QueryTypes.SELECT }
    )
    return result
  } catch (error) {
    logger.error(`Error when searching modules and children with code: ${code}`)
    logger.error(error)
    return null
  }
}

const modifyParent = (course: ModuleWithChildren, moduleMap: Record<string, ModuleWithChildren>) => {
  let parent = moduleMap[course.parent_id]
  const parents: any[] = []
  while (parent) {
    parents.push(parent)
    parent = moduleMap[parent.parent_id]
  }

  const skip = 0
  const parentsWithCode = parents.filter(p => p.code)
  if (parentsWithCode.length > 0) {
    parent = parentsWithCode[skip >= parentsWithCode.length ? parentsWithCode.length - 1 : skip]
  } else {
    parent = parents.find(m => m.code)
  }
  if (!parent) {
    return null
  }
  return { ...course, parent_id: parent.id, parent_code: parent.code, parent_name: parent.name }
}

const labelProgammes = (modules: ModuleWithChildren[], excludedCourses: ExcludedCourse[]) => {
  return modules.map(module => {
    const label = {
      id: module.parent_name.fi,
      label: `${module.parent_code}\n${module.parent_name.fi}`,
      orderNumber: module.module_order,
    }
    const foundCourse = excludedCourses.find(course => course.course_code === module.code)
    const visible = { visibility: !foundCourse, id: foundCourse?.id ?? null }
    return { ...module, label, visible }
  })
}

const getCoursesAndModulesForProgramme = async (code: string, periodIds: string) => {
  if (!periodIds) {
    return {}
  }
  const result = await recursivelyGetModuleAndChildren(code, periodIds.split(','))
  if (!result) {
    return {}
  }
  const courses = result.filter(r => r.type === 'course')
  const modules = result.filter(r => r.type === 'module')
  const excludedCourses = await ExcludedCourse.findAll({
    where: {
      programme_code: {
        [Op.eq]: code,
      },
      curriculum_version: {
        [Op.eq]: periodIds,
      },
    },
  })
  const modulesMap = modules.reduce<Record<string, ModuleWithChildren>>((obj, cur) => ({ ...obj, [cur.id]: cur }), {})
  const modifiedCourses = courses
    .map(course => modifyParent(course, modulesMap))
    .filter(course => course != null)
    .filter(
      (course1, index, array) =>
        array.findIndex(course2 => course1.code === course2.code && course1.parent_code === course2.parent_code) ===
        index
    )

  return { courses: labelProgammes(modifiedCourses, excludedCourses), modules }
}

export const getCoursesAndModules = async (code: string, periodIds: string) => {
  const defaultProgrammeCourses = await getCoursesAndModulesForProgramme(code, periodIds)
  if (code in combinedStudyProgrammes) {
    const secondProgramme = combinedStudyProgrammes[code as keyof typeof combinedStudyProgrammes]
    const secondProgrammeCourses = await getCoursesAndModulesForProgramme(secondProgramme, periodIds)
    return { defaultProgrammeCourses, secondProgrammeCourses }
  }
  return { defaultProgrammeCourses, secondProgrammeCourses: { courses: [], modules: [] } }
}
