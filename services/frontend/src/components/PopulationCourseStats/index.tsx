import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { orderBy } from 'lodash-es'
import { useState, useEffect } from 'react'

import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { FilteredCourse, FilteredCourseStats, CourseModule, FilteredProgrammeCourse } from '@/util/coursesOfPopulation'
import type { CourseStats } from '@oodikone/shared/routes/populations'
import type { Module, Name, CurriculumDetails } from '@oodikone/shared/types'
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
    // Change courses type from FilteredCourse[] to FilteredProgrammeCourse[] + add module-field to object so we can deconstruct it below
    const modules: Record<
      string,
      Omit<Module, 'courses'> & { courses: FilteredProgrammeCourse[] } & {
        module: { code: string; name: Name; stats?: FilteredCourseStats }
      }
    > = (filteredCourses ?? [])
      .filter(({ course }) => visibleCoursesFilter(course, curriculum))
      // it needs to be with flatMap and filter and not map and find
      // because there can be many mandatoryCourses with the same course code
      // as they can belong to many categories
      .flatMap(course => {
        const defaultProgrammeCourses: FilteredProgrammeCourse[] = curriculum.defaultProgrammeCourses
          .filter(pg => pg.code === course.course.code)
          .map(programmeCourse => ({ ...course, ...programmeCourse }))

        const secondProgrammeCourses: FilteredProgrammeCourse[] = curriculum.secondProgrammeCourses
          .filter(pg => pg.code === course.course.code)
          .map(programmeCourse => ({ ...course, ...programmeCourse }))

        return [defaultProgrammeCourses, secondProgrammeCourses].flat()
      })
      .reduce((modules, course) => {
        modules[course.parent_code!] ??= {
          module: { code: course.parent_code, name: course.parent_name, stats: {} },
          courses: [],
        }
        modules[course.parent_code!].courses.push(course)

        return modules
      }, {})

    // Add statistics to modules
    Object.keys(modules).map(parentCode => {
      const moduleWithCode = filteredCourses.find(course => course.course.code === parentCode)
      modules[parentCode].module.stats = moduleWithCode?.stats
    })

    setModules(
      orderBy(
        Object.values(modules).map(({ module, courses }) => ({
          name: module.name,
          code: module.code,
          stats: module.stats,
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
