import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState } from 'react'

import type { FilteredCourse, UnionOfFilteredModuleCourse } from '@/util/coursesOfPopulation'
import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'

// TODO: When we convert <PassFailEnrollments /> to ts, check optional
// values in there. Now you just have to remember to define them :)
type PopulationCourseStatsFlatProps = {
  filteredCourses: FilteredCourse[]
  studentAmountLimit: number
  onlyIamRights?: boolean
  courseTableMode?: 'all' | 'curriculum'
  showModules?: boolean
  setShowModules?: (input: boolean) => void
}

export const PopulationCourseStatsFlat = ({
  filteredCourses,
  studentAmountLimit,
  onlyIamRights,
  courseTableMode,
  showModules,
  setShowModules,
}: PopulationCourseStatsFlatProps) => {
  const [tab, setTab] = useState(0)

  if (!filteredCourses) return null

  const courseStatistics: UnionOfFilteredModuleCourse = filteredCourses
    .filter(({ stats }) => studentAmountLimit <= stats.students)
    .filter(({ course }) => (showModules ? course.is_study_module : !course.is_study_module))
    .map(course => {
      const { students, passed, passedOfPopulation } = course.stats
      // Modules have only some stats while courses have all
      const stats = showModules ? { students, passed, passedOfPopulation } : course.stats

      return {
        ...course,
        name: course.course.name,
        code: course.course.code,
        stats,
      }
    })

  const panes = [
    {
      menuItem: 'Pass/fail',
      render: () => (
        <PassFailEnrollments
          courseStatistics={courseStatistics}
          courseTableMode={courseTableMode}
          onlyIamRights={onlyIamRights}
          setShowModules={setShowModules}
          showModules={showModules}
        />
      ),
    },
    {
      menuItem: 'Grades',
      render: () => (
        <GradeDistribution
          courseStatistics={courseStatistics}
          courseTableMode={courseTableMode}
          onlyIamRights={onlyIamRights}
          setShowModules={setShowModules}
          showModules={showModules}
        />
      ),
    },
  ]

  return (
    <>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ menuItem }) => (
          <Tab key={menuItem} label={menuItem} />
        ))}
      </Tabs>
      {panes.at(tab)?.render()}
    </>
  )
}
