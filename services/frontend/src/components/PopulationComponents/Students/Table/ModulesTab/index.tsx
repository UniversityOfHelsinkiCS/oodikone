import { useMemo } from 'react'

import { ModulesTab } from '@/components/PopulationComponents/Students/Table/ModulesTab/ModulesTable'
import { getStudyplanModules, StudyModuleData } from '@/components/PopulationComponents/Students/Table/ModulesTab/util'
import { useCurriculum } from '@/hooks/useCurriculum'
import { createLocaleComparator } from '@/util/comparator'
import { Name, ProgrammeCourse, ProgrammeModule, FormattedStudent as Student } from '@oodikone/shared/types'

export type ModuleTabStudent = {
  firstNames: string
  lastName: string
  studentNumber: string
  studyModulesInHOPS: StudyModuleData[]
  sisPersonID: string
}

export type FormattedModules = Record<string, Name>

const formatStudent = (
  student: Student,
  degreeProgrammeCodes: string[],
  curriculumModuleCodeByGroupId: Map<string, string>
): ModuleTabStudent => ({
  firstNames: student.firstnames,
  lastName: student.lastname,
  studentNumber: student.studentNumber,
  studyModulesInHOPS: getStudyplanModules(student, degreeProgrammeCodes, curriculumModuleCodeByGroupId),
  sisPersonID: student.sis_person_id,
})

/* Dig modules through courses to account for visibility settings.
   A module is not visible if all it's courses are hidden. */
const getVisibleModules = (curriculumCourses: ProgrammeCourse[]) => {
  const localeComparator = createLocaleComparator()
  const modulesUnordered = curriculumCourses?.reduce<FormattedModules>((modules, course) => {
    if (course.parent_code && !modules[course.parent_code] && course.visible?.visibility) {
      modules[course.parent_code] = course.parent_name
    }
    return modules
  }, {})

  return Object.fromEntries(Object.entries(modulesUnordered).sort(([keyA], [keyB]) => localeComparator(keyA, keyB)))
}

const getDegreeProgrammeCodes = (curriculumModules: ProgrammeModule[]): string[] => {
  return curriculumModules.filter(mod => !!mod.degree_programme_type).map(mod => mod.code)
}

export const ModulesTabContainer = ({ students, programme }: { students: Student[]; programme: string }) => {
  const { curriculum } = useCurriculum()
  const curriculumModules = useMemo(
    () => (curriculum ? [...curriculum.defaultProgrammeModules, ...curriculum.secondProgrammeModules] : []),
    [curriculum]
  )
  const curriculumCourses = useMemo(
    () => (curriculum ? [...curriculum.defaultProgrammeCourses, ...curriculum.secondProgrammeCourses] : []),
    [curriculum]
  )

  const degreeProgrammeCodes = useMemo(() => getDegreeProgrammeCodes(curriculumModules), [curriculumModules])

  const curriculumModuleCodeByGroupId = useMemo(
    () => new Map(curriculumModules.map(({ group_id, code }) => [group_id, code])),
    [curriculumModules]
  )

  const formattedModules = useMemo(() => getVisibleModules(curriculumCourses), [curriculumCourses])

  const formattedStudents = useMemo(
    () => students.map(student => formatStudent(student, degreeProgrammeCodes, curriculumModuleCodeByGroupId)),
    [students, degreeProgrammeCodes, curriculumModuleCodeByGroupId]
  )

  return <ModulesTab formattedModules={formattedModules} formattedStudents={formattedStudents} programme={programme} />
}
