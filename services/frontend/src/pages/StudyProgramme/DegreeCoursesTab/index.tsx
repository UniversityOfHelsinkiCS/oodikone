import Stack from '@mui/material/Stack'

import { orderBy } from 'lodash'
import { useEffect, useState } from 'react'

import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { Module, ProgrammeCourse } from '@oodikone/shared/types'
import { useCurriculumState } from '../../../hooks/useCurriculums'
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
  const [curriculum, curriculumList, setCurriculum] = useCurriculumState(studyProgramme, year)
  const { data: criteria } = useGetProgressCriteriaQuery({ programmeCode: studyProgramme })

  const getModules = (courses: ProgrammeCourse[]): Module[] => {
    const modules: Record<string, ProgrammeCourse[]> = {}
    courses.forEach(course => {
      const code = course.parent_code!
      if (!modules[code]) {
        modules[code] = []
      }
      modules[code].push(course)
    })

    return orderBy(
      Object.entries(modules).map(([code, courses]) => ({
        code,
        courses,
        order: courses[0].module_order,
      })),
      module => module.code
    )
  }

  useEffect(() => {
    if (!curriculum?.defaultProgrammeCourses?.length) {
      return
    }

    setDefaultProgrammeModules(getModules(curriculum.defaultProgrammeCourses))
    if (combinedProgramme) {
      setSecondProgrammeModules(getModules(curriculum.secondProgrammeCourses))
    }
  }, [combinedProgramme, curriculum])

  if (!curriculum || !criteria) return null

  return (
    <Stack gap={2}>
      <CurriculumSection curriculum={curriculum} curriculumList={curriculumList} setCurriculum={setCurriculum} />
      {isBachelorOrLicentiateProgramme(studyProgramme) && (
        <CreditCriteriaSection criteria={criteria} studyProgramme={studyProgramme} />
      )}
      {defaultProgrammeModules.length > 1 && curriculum && (
        <DegreeCourseTable
          combinedProgramme=""
          criteria={criteria}
          curriculumVersion={curriculum.version}
          modules={defaultProgrammeModules}
          studyProgramme={studyProgramme}
        />
      )}
      {secondProgrammeModules.length > 0 && curriculum && (
        <DegreeCourseTable
          combinedProgramme={combinedProgramme}
          criteria={criteria}
          curriculumVersion={curriculum.version}
          modules={secondProgrammeModules}
          studyProgramme={studyProgramme}
        />
      )}
    </Stack>
  )
}
