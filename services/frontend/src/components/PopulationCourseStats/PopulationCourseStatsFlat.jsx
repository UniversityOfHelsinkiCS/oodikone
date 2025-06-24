import { Tab } from 'semantic-ui-react'

import { clearCourseStats } from '@/redux/courseStats'
import { useAppDispatch } from '@/redux/hooks'
import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'
import { PopulationCourseContext } from './PopulationCourseContext'

export const PopulationCourseStatsFlat = ({ filteredCourses, studentAmountLimit }) => {
  const dispatch = useAppDispatch()

  if (!filteredCourses) return null

  const contextValue = {
    courseStatistics: filteredCourses?.filter(({ stats }) => stats.students >= studentAmountLimit),
    onGoToCourseStatisticsClick: () => dispatch(clearCourseStats()),
  }

  const panes = [
    {
      menuItem: 'Pass/fail',
      render: () => (
        <Tab.Pane>
          <PassFailEnrollments flat />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Grades',
      render: () => (
        <Tab.Pane>
          <GradeDistribution flat />
        </Tab.Pane>
      ),
    },
  ]

  return (
    <PopulationCourseContext.Provider value={contextValue}>
      <Tab panes={panes} />
    </PopulationCourseContext.Provider>
  )
}
