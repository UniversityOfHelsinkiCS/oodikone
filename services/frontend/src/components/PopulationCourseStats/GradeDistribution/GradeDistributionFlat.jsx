import React from 'react'
import { Table } from 'semantic-ui-react'
import { UsePopulationCourseContext } from '../PopulationCourseContext'
import GradeDistributionHeader from './GradeDistributionHeader'
import GradeDistributionRow from './GradeDistributionRow'

const gradeTypes = [1, 2, 3, 4, 5]

const GradeDistributionFlat = () => {
  const { courseStatistics } = UsePopulationCourseContext()

  return (
    <Table celled sortable className="fixed-header">
      <GradeDistributionHeader gradeTypes={gradeTypes} />
      <Table.Body>
        {courseStatistics.map(stats => (
          <GradeDistributionRow key={stats.course.code} courseStatistics={stats} gradeTypes={gradeTypes} />
        ))}
      </Table.Body>
    </Table>
  )
}

export default GradeDistributionFlat
