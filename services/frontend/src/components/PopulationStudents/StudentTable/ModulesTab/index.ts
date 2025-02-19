import { useMemo } from 'react'
import { ModulesTab } from './ModulesTable'

export type FormattedStudent = {
  firstNames: string
  lastName: string
  studentNumber: string
  modulesInHOPS: string[]
  sis_person_id: string
}

export type FormattedModules = Record<string, Record<string, string>>

const formatStudent = (student: any): FormattedStudent => {
  return {
    firstNames: student.firstnames,
    lastName: student.lastname,
    studentNumber: student.studentNumber,
    modulesInHOPS: student.studyplans?.[0]?.includedModules,
    sis_person_id: student.sis_person_id,
  }
}

const getAllModules = (modules: any[], degreeProgrammeCodes: string[]): FormattedModules => {
  return modules.reduce((acc: FormattedModules, cur: any) => {
    if (
      !!cur.code &&
      (degreeProgrammeCodes.includes(cur.parent_code) || (!cur.parent_code && !degreeProgrammeCodes.includes(cur.code)))
    ) {
      acc[cur.code] = cur.name
    }
    return acc
  }, {})
}

const getDegreeProgrammeCodes = (curriculumModules): string[] => {
  return curriculumModules.filter(mod => !!mod.degree_programme_type).map(mod => mod.code)
}

export const ModulesTabContainer = ({ curriculum, students }) => {
  const curriculumCombined = useMemo(
    () => [...curriculum.defaultProgrammeModules, ...curriculum.secondProgrammeModules],
    [curriculum]
  )

  const degreeProgrammeCodes = useMemo(() => getDegreeProgrammeCodes(curriculumCombined), [curriculumCombined])

  const formattedModules = useMemo(
    () => getAllModules(curriculumCombined, degreeProgrammeCodes),
    [curriculumCombined, degreeProgrammeCodes]
  )

  const formattedStudents = useMemo(() => students.map(formatStudent), [students])

  return ModulesTab({ formattedModules, formattedStudents })
}
