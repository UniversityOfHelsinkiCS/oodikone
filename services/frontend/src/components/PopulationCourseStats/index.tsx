import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { orderBy } from 'lodash-es'
import { useState, useEffect } from 'react'

import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import type { CourseStats } from '@oodikone/shared/routes/populations'
import type { Module, CourseModule, Name, CurriculumDetails, ProgrammeCourse } from '@oodikone/shared/types'
import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'
import { PassingSemesters } from './PassingSemesters'

type PopulationCourseStatsProps = {
  filteredCourses: FilteredCourse[]
  pending: boolean
  onlyIamRights: boolean
  curriculum: ExtendedCurriculumDetails
  courseTableMode: 'all' | 'curriculum'
  showModules: boolean
  setShowModules: (input: boolean) => void
}

const visibleCoursesFilter = (course: CourseStats, mandatoryCourses: CurriculumDetails) =>
  mandatoryCourses?.defaultProgrammeCourses?.some(
    programmeCourse => programmeCourse.code === course.code && programmeCourse.visible.visibility
  ) ??
  mandatoryCourses?.secondProgrammeCourses?.some(
    programmeCourse => programmeCourse.code === course.code && programmeCourse.visible.visibility
  ) ??
  false

export const PopulationCourseStats = ({
  filteredCourses,
  pending,
  onlyIamRights,
  curriculum,
  courseTableMode,
  showModules,
  setShowModules,
}: PopulationCourseStatsProps) => {
  const [modules, setModules] = useState<CourseModule[]>([])
  const [tab, setTab] = useState(0)

  useEffect(() => {
    const modules: Record<string, Module & { module: { code: string; name: Name } }> = (filteredCourses ?? [])
      .filter(({ course }) => visibleCoursesFilter(course, curriculum))
      // it needs to be with flatMap and filter and not map and find
      // because there can be many mandatoryCourses with the same course code
      // as they can belong to many categories
      .flatMap(course => {
        const defaultProgrammeCourses: (ProgrammeCourse & FilteredCourse)[] = curriculum.defaultProgrammeCourses
          .filter(pg => pg.code === course.course.code)
          .map(programmeCourse => ({ ...course, ...programmeCourse }))

        const secondProgrammeCourses: (ProgrammeCourse & FilteredCourse)[] = curriculum.secondProgrammeCourses
          .filter(pg => pg.code === course.course.code)
          .map(programmeCourse => ({ ...course, ...programmeCourse }))

        return [defaultProgrammeCourses, secondProgrammeCourses].flat()
      })
      .reduce((modules, course) => {
        // FIXME: This is sus, I don't know if this assertion holds. CHECK!
        modules[course.parent_code!] ??= { module: { code: course.parent_code, name: course.parent_name }, courses: [] }
        modules[course.parent_code!].courses.push(course)

        return modules
      }, {})

    setModules(
      orderBy(
        Object.values(modules).map(({ module, courses }) => ({
          name: module.name,
          code: module.code,
          courses,
        })),
        item => item.code
      )
    )
  }, [filteredCourses, curriculum])

  const panes = [
    {
      label: 'Pass/fail',
      render: (
        <PassFailEnrollments
          courseStatistics={modules}
          courseTableMode={courseTableMode}
          onlyIamRights={onlyIamRights}
          setShowModules={setShowModules}
          showModules={showModules}
        />
      ),
    },
    {
      label: 'Grades',
      render: (
        <GradeDistribution
          courseStatistics={modules}
          courseTableMode={courseTableMode}
          onlyIamRights={onlyIamRights}
          setShowModules={setShowModules}
          showModules={showModules}
        />
      ),
    },
    {
      label: 'When passed',
      render: (
        <PassingSemesters
          courseStatistics={modules}
          courseTableMode={courseTableMode}
          onlyIamRights={onlyIamRights}
          setShowModules={setShowModules}
          showModules={showModules}
        />
      ),
    },
  ]

  if (!filteredCourses || pending) return null

  return (
    <>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ label }) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      {panes.at(tab)?.render ?? null}
    </>
  )
}
