import { useMemo } from 'react'

import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { createLocaleComparator } from '@/util/comparator'
import { formatISODate } from '@/util/timeAndDate'
import { Name, ProgrammeCourse, FormattedStudent as Student } from '@oodikone/shared/types'
import { ModulesTab } from './ModulesTable'

export type ModuleTabStudent = {
  firstNames: string
  lastName: string
  studentNumber: string
  studyModulesInHOPS: StudyModuleData[]
  sisPersonID: string
}

export type FormattedModules = Record<string, Name>

type StudyModuleData = { code: string; completed: boolean; completionDate: string | null }

const getModulesFromRelevantStudyPlan = (student: Student, degreeProgrammeCodes: string[]): StudyModuleData[] => {
  if (!student.studyRights || !Array.isArray(student.studyRights)) {
    return []
  }

  const relevantStudyRight =
    student.studyRights?.find(studyRight =>
      studyRight.studyRightElements?.some(element => degreeProgrammeCodes.includes(element.code))
    ) ?? null

  if (relevantStudyRight) {
    const studyModules =
      student.studyplans?.find(
        plan => plan.sis_study_right_id === relevantStudyRight.id && degreeProgrammeCodes.includes(plan.programme_code)
      )?.includedModules ?? []

    return studyModules.map(studyModule => {
      const completion = student.courses.find(course => course.course_code === studyModule && course.passed)
      return {
        code: studyModule,
        completed: !!completion,
        completionDate: completion ? formatISODate(completion.date) : null,
      }
    })
  }

  return []
}

const formatStudent = (student: Student, degreeProgrammeCodes: string[]): ModuleTabStudent => {
  return {
    firstNames: student.firstnames,
    lastName: student.lastname,
    studentNumber: student.studentNumber,
    studyModulesInHOPS: getModulesFromRelevantStudyPlan(student, degreeProgrammeCodes),
    sisPersonID: student.sis_person_id,
  }
}

const getAllModules = (curriculumCourses: ProgrammeCourse[]) => {
  const localeComparator = createLocaleComparator()
  const modulesUnordered = curriculumCourses?.reduce<FormattedModules>((modules, course) => {
    if (course.parent_code && !modules[course.parent_code] && course.visible?.visibility) {
      modules[course.parent_code] = course.parent_name
    }
    return modules
  }, {})

  return Object.fromEntries(Object.entries(modulesUnordered).sort(([keyA], [keyB]) => localeComparator(keyA, keyB)))
}

const getDegreeProgrammeCodes = (curriculumModules): string[] => {
  return curriculumModules.filter(mod => !!mod.degree_programme_type).map(mod => mod.code)
}

export const ModulesTabContainer = ({
  curriculum,
  students,
}: {
  curriculum: ExtendedCurriculumDetails | null | undefined
  students: Student[]
}) => {
  const curriculumModules = useMemo(
    () => (curriculum ? [...curriculum.defaultProgrammeModules, ...curriculum.secondProgrammeModules] : []),
    [curriculum]
  )
  const curriculumCourses = useMemo(
    () => (curriculum ? [...curriculum.defaultProgrammeCourses, ...curriculum.secondProgrammeCourses] : []),
    [curriculum]
  )

  const degreeProgrammeCodes = useMemo(() => getDegreeProgrammeCodes(curriculumModules), [curriculumModules])

  const formattedModules = useMemo(() => getAllModules(curriculumCourses), [curriculumCourses])

  const formattedStudents = useMemo(
    () => students.map(student => formatStudent(student, degreeProgrammeCodes)),
    [students, degreeProgrammeCodes]
  )

  return <ModulesTab formattedModules={formattedModules} formattedStudents={formattedStudents} />
}
