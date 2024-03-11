import { arrayOf, bool, func, string } from 'prop-types'
import React from 'react'
import { Table } from 'semantic-ui-react'
import { courseDataWithRealisationsType } from '@/constants/types'
import { FoldableRow } from './foldableRow'

const getHeader = categoryName => {
  const getHeaderCell = content => <Table.HeaderCell key={content}>{content}</Table.HeaderCell>
  const headerLabels = [categoryName, 'Passed', 'Failed', 'Pass rate']
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell />
        {headerLabels.map(getHeaderCell)}
      </Table.Row>
    </Table.Header>
  )
}

export const AttemptsTable = ({ categoryName, data, onClickCourse, userHasAccessToAllStats }) => (
  <Table className="fixed-header" selectable style={{ cursor: 'pointer' }}>
    {getHeader(categoryName)}
    <Table.Body>
      {data.map(course => (
        <FoldableRow
          courseData={course}
          key={course.id}
          onClickFn={onClickCourse}
          userHasAccessToAllStats={userHasAccessToAllStats}
        />
      ))}
    </Table.Body>
  </Table>
)

AttemptsTable.propTypes = {
  categoryName: string.isRequired,
  data: arrayOf(courseDataWithRealisationsType).isRequired,
  onClickCourse: func.isRequired,
  userHasAccessToAllStats: bool.isRequired,
}
