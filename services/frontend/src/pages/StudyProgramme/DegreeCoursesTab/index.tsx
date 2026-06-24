import Stack from '@mui/material/Stack'

import { orderBy } from 'lodash-es'
import { useEffect, useState } from 'react'

import { useCurriculumState } from '@/hooks/useCurriculums'
import { CreditCriteriaSection } from '@/pages/StudyProgramme/DegreeCoursesTab/CreditCriteriaSection'
import { CurriculumSection } from '@/pages/StudyProgramme/DegreeCoursesTab/CurriculumSection'
import { DegreeCourseTable } from '@/pages/StudyProgramme/DegreeCoursesTab/DegreeCourseTable'
import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { Module, ProgrammeCourse } from '@oodikone/shared/types'

export const DegreeCoursesTab = ({
  combinedProgramme,
  degreeProgramme,
}: {
  combinedProgramme: string
  degreeProgramme: string
}) => {
  const [defaultProgrammeModules, setDefaultProgrammeModules] = useState<Module[]>([])
  const [secondProgrammeModules, setSecondProgrammeModules] = useState<Module[]>([])
  const [curriculum, curriculumList, setCurriculum] = useCurriculumState(degreeProgramme, new Date().getFullYear())
  const { data: criteria } = useGetProgressCriteriaQuery({ programmeCode: degreeProgramme })

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
      {isBachelorOrLicentiateProgramme(degreeProgramme) && (
        <CreditCriteriaSection criteria={criteria} degreeProgramme={degreeProgramme} />
      )}
      {defaultProgrammeModules.length > 1 && curriculum ? (
        <DegreeCourseTable
          combinedProgramme=""
          criteria={criteria}
          curriculumVersion={curriculum.periodIds}
          modules={defaultProgrammeModules}
          studyProgramme={degreeProgramme}
        />
      ) : null}
      {secondProgrammeModules.length > 0 && curriculum ? (
        <DegreeCourseTable
          combinedProgramme={combinedProgramme}
          criteria={criteria}
          curriculumVersion={curriculum.periodIds}
          modules={secondProgrammeModules}
          studyProgramme={degreeProgramme}
        />
      ) : null}
    </Stack>
  )
}
