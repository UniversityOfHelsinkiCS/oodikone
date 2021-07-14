import React, { useState } from 'react'
import { Table } from 'semantic-ui-react'
import PassingSemesterRow from './PassingSemesterRow'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import CumulativeCheckbox from './CumulativeCheckbox'
import PassingSemestersHeader from './PassingSemestersHeader'

const PassingSemesters = () => {
  const { courseStatistics, onCourseNameCellClick, isActiveCourse } = UsePopulationCourseContext()
  const [cumulativeStats, setCumulativeStats] = useState(false)

  return (
    <div>
      <CumulativeCheckbox cumulativeStats={cumulativeStats} setCumulativeStats={setCumulativeStats} />
      <Table celled className="fixed-header">
        <PassingSemestersHeader />
        <Table.Body>
          {courseStatistics.map(stats => (
            <PassingSemesterRow
              key={stats.course.code}
              statistics={stats}
              isActiveCourseFn={isActiveCourse}
              onCourseNameClickFn={onCourseNameCellClick}
              cumulative={cumulativeStats}
            />
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export default PassingSemesters
