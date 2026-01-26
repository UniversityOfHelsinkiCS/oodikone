import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState } from 'react'

import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'

export const PopulationCourseStatsFlat = ({ filteredCourses, studentAmountLimit }) => {
  const [tab, setTab] = useState(0)

  if (!filteredCourses) return null

  const courseStatistics = filteredCourses
    .filter(({ stats }) => studentAmountLimit <= stats.students)
    .map(course => ({
      ...course,
      name: course.course.name,
      code: course.course.code,
    }))

  const panes = [
    {
      menuItem: 'Pass/fail',
      render: () => <PassFailEnrollments courseStatistics={courseStatistics} />,
    },
    {
      menuItem: 'Grades',
      render: () => <GradeDistribution courseStatistics={courseStatistics} />,
    },
  ]

  return (
    <>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ menuItem }) => (
          <Tab key={menuItem} label={menuItem} />
        ))}
      </Tabs>
      {panes.at(tab).render()}
    </>
  )
}
