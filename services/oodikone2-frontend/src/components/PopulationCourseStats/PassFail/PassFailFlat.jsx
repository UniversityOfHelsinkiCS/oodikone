import React from 'react'
import { Table } from 'semantic-ui-react'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import PassFailHeader from './PassFailHeader'
import PassFailRow from './PassFailRow'

const PassFail = () => {
  const { courseStatistics } = UsePopulationCourseContext()

  return (
    <Table className="fixed-header" celled sortable>
      <PassFailHeader />
      <Table.Body>
        {courseStatistics.map(stats => (
          <PassFailRow key={stats.course.code} courseStats={stats} />
        ))}
      </Table.Body>
    </Table>
  )
}

export default PassFail
