import { Stack } from '@mui/material'
import { orderBy } from 'lodash'
import { useEffect, useState } from 'react'

import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { CurriculumDetails, Module, ProgrammeCourse, ProgressCriteria } from '@/shared/types'
import { CreditCriteriaSection } from './CreditCriteriaSection'
import { CurriculumSection } from './CurriculumSection'
import { DegreeCourseTable } from './DegreeCourseTable'

export const DegreeCoursesTab = ({
  combinedProgramme,
  studyProgramme,
  year,
}: {
  combinedProgramme: string
  studyProgramme: string
  year: string
}) => {
  const [defaultProgrammeModules, setDefaultProgrammeModules] = useState<Module[]>([])
  const [secondProgrammeModules, setSecondProgrammeModules] = useState<Module[]>([])
  const [curriculum, setCurriculum] = useState<(CurriculumDetails & { version: string[] }) | null>(null)
  const { data: progressCriteria } = useGetProgressCriteriaQuery({ programmeCode: studyProgramme })
  const emptyCriteria: ProgressCriteria = {
    allCourses: {},
    courses: { yearOne: [], yearTwo: [], yearThree: [], yearFour: [], yearFive: [], yearSix: [] },
    credits: { yearOne: 0, yearTwo: 0, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 },
  }
  const criteria = progressCriteria ?? emptyCriteria

  useEffect(() => {
    if (!curriculum?.defaultProgrammeCourses?.length) {
      return
    }
    const defaultModules: Record<string, ProgrammeCourse[]> = {}
    const secondProgrammeModules: Record<string, ProgrammeCourse[]> = {}
    curriculum.defaultProgrammeCourses.forEach(course => {
      const code = course.parent_code
      if (!defaultModules[code]) {
        defaultModules[code] = []
      }
      defaultModules[code].push(course)
    })
    if (combinedProgramme) {
      curriculum.secondProgrammeCourses.forEach(course => {
        const code = course.parent_code
        if (!secondProgrammeModules[code]) {
          secondProgrammeModules[code] = []
        }
        secondProgrammeModules[code].push(course)
      })
    }

    setDefaultProgrammeModules(
      orderBy(
        Object.entries(defaultModules).map(([module, courses]) => ({
          module,
          courses,
          module_order: courses[0].module_order,
        })),
        module => module.module
      )
    )
    setSecondProgrammeModules(
      orderBy(
        Object.entries(secondProgrammeModules).map(([module, courses]) => ({
          module,
          courses,
          module_order: courses[0].module_order,
        })),
        module => module.module
      )
    )
  }, [combinedProgramme, curriculum])

  return (
    <Stack gap={2}>
      <CurriculumSection
        programmeCodes={[studyProgramme, combinedProgramme]}
        setCurriculum={setCurriculum}
        year={year}
      />
      {(studyProgramme.includes('KH') || ['MH30_001', 'MH30_003'].includes(studyProgramme)) && (
        <CreditCriteriaSection criteria={criteria} studyProgramme={studyProgramme} />
      )}
      {defaultProgrammeModules && defaultProgrammeModules.length > 1 && (
        <DegreeCourseTable
          combinedProgramme=""
          criteria={criteria}
          curriculum={curriculum}
          modules={defaultProgrammeModules}
          studyProgramme={studyProgramme}
        />
      )}
      {secondProgrammeModules.length > 0 && (
        <DegreeCourseTable
          combinedProgramme={combinedProgramme}
          criteria={criteria}
          curriculum={curriculum}
          modules={secondProgrammeModules}
          studyProgramme={studyProgramme}
        />
      )}
    </Stack>
  )
}
