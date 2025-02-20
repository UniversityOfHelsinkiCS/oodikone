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

const getModulesFromRelevantStudyPlan = (student: any, degreeProgrammeCodes: string[]): string[] => {
  if (!student.studyRights || !Array.isArray(student.studyRights)) {
    return []
  }

  const relevantStudyRight =
    student.studyRights?.find((studyRight: any) =>
      studyRight?.studyRightElements?.some((element: any) => degreeProgrammeCodes.includes(element.code))
    ) ?? false

  if (relevantStudyRight) {
    return (
      student.studyplans?.find((plan: any) => plan.sis_study_right_id === relevantStudyRight.id)?.includedModules ?? []
    )
  }

  return []
}

const formatStudent = (student: any, degreeProgrammeCodes: string[]): FormattedStudent => {
  return {
    firstNames: student.firstnames,
    lastName: student.lastname,
    studentNumber: student.studentNumber,
    modulesInHOPS: getModulesFromRelevantStudyPlan(student, degreeProgrammeCodes),
    sis_person_id: student.sis_person_id,
  }
}

const getAllModules = (curriculumCourses: any[]) =>
  curriculumCourses?.reduce<FormattedModules>((modules, course) => {
    if (!modules[course.parent_code] && course.visible?.visibility) {
      modules[course.parent_code] = course.parent_name
    }
    return modules
  }, {})

const getDegreeProgrammeCodes = (curriculumModules): string[] => {
  return curriculumModules.filter(mod => !!mod.degree_programme_type).map(mod => mod.code)
}

export const ModulesTabContainer = ({ curriculum, students }) => {
  const curriculumModules = useMemo(
    () => [...curriculum.defaultProgrammeModules, ...curriculum.secondProgrammeModules],
    [curriculum]
  )
  const curriculumCourses = useMemo(
    () => [...curriculum.defaultProgrammeCourses, ...curriculum.secondProgrammeCourses],
    [curriculum]
  )

  const degreeProgrammeCodes = useMemo(() => getDegreeProgrammeCodes(curriculumModules), [curriculumModules])

  const formattedModules = useMemo(() => getAllModules(curriculumCourses), [curriculum, degreeProgrammeCodes])

  const formattedStudents = useMemo(
    () => students.map(student => formatStudent(student, degreeProgrammeCodes)),
    [students, degreeProgrammeCodes]
  )

  return ModulesTab({ formattedModules, formattedStudents })
}
