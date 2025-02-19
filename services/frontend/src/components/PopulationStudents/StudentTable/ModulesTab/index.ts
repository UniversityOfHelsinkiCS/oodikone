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

const getAllModules = (students: any[]): string[] => {
  return Array.from(
    students.reduce((acc: Set<string>, cur: any) => {
      if (cur.studyplans?.[0]?.includedModules) {
        cur.studyplans[0].includedModules.forEach((mod: string) => {
          acc.add(mod)
        })
      }
      return acc
    }, new Set())
  )
}

export const ModulesTabContainer = ({ curriculum, students }) => {
  const modules = useMemo(() => getAllModules(students), [students])

  const curriculumCombined = useMemo(
    () => [...curriculum.defaultProgrammeModules, ...curriculum.secondProgrammeModules],
    [curriculum]
  )

  const formattedStudents = useMemo(() => students.map(formatStudent), [students])

  const formattedModules = useMemo(() => {
    return modules.reduce<FormattedModules>((acc, moduleCode) => {
      const match = curriculumCombined.find(item => item.code === moduleCode)
      if (match) {
        acc[moduleCode] = match.name
      }
      return acc
    }, {})
  }, [modules, curriculumCombined])

  return ModulesTab({ formattedModules, formattedStudents })
}
