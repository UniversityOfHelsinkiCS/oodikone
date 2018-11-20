import React from 'react'
import { Table } from 'semantic-ui-react'
import { string, arrayOf, func } from 'prop-types'

import { courseDataWithRealisationsType } from '../../../constants/types'
import FoldableRow from './foldableRow'

const getHeader = (categoryName) => {
  const getHeaderCell = content => <Table.HeaderCell content={content} />
  const headerLabels = ['', categoryName, 'Passed', 'Failed', 'Pass rate']
  return (
    <Table.Header>
      <Table.Row>
        {headerLabels.map(getHeaderCell)}
      </Table.Row>
    </Table.Header>
  )
}

const CumulativeTable = ({ categoryName, data, onClickCourse }) => (
  <Table structured>
    {getHeader(categoryName)}
    <Table.Body>
      { data.map(course => <FoldableRow courseData={course} onClickFn={onClickCourse} />)}
    </Table.Body>
  </Table>
)

CumulativeTable.propTypes = {
  categoryName: string.isRequired,
  data: arrayOf(courseDataWithRealisationsType).isRequired,
  onClickCourse: func.isRequired
}

export default CumulativeTable
