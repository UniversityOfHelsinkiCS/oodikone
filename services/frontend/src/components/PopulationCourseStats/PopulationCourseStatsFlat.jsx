import { Tab } from 'semantic-ui-react'

import { clearCourseStats } from '@/redux/courseStats'
import { useAppDispatch } from '@/redux/hooks'
import { GradeDistribution } from './GradeDistribution'
import { PassFailEnrollments } from './PassFailEnrollments'
import { PopulationCourseContext } from './PopulationCourseContext'

export const PopulationCourseStatsFlat = ({ courses, studentAmountLimit }) => {
  const dispatch = useAppDispatch()

  if (!courses) return null

  const contextValue = {
    courseStatistics: courses?.coursestatistics.filter(({ stats }) => stats.students >= studentAmountLimit),
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
