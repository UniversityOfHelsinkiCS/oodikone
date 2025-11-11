import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState } from 'react'

import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'
import { PopulationCourseContext } from './PopulationCourseContext'

export const PopulationCourseStatsFlat = ({ filteredCourses, studentAmountLimit }) => {
  const [tab, setTab] = useState(0)

  if (!filteredCourses) return null

  const contextValue = {
    courseStatistics: filteredCourses.filter(({ stats }) => stats.students >= studentAmountLimit),
  }

  const panes = [
    {
      menuItem: 'Pass/fail',
      render: () => <PassFailEnrollments flat />,
    },
    {
      menuItem: 'Grades',
      render: () => <GradeDistribution />,
    },
  ]

  return (
    <PopulationCourseContext.Provider value={contextValue}>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ menuItem }) => (
          <Tab key={menuItem} label={menuItem} />
        ))}
      </Tabs>
      {panes.at(tab).render()}
    </PopulationCourseContext.Provider>
  )
}
