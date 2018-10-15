import React from 'react'
import { Table } from 'semantic-ui-react'
import { string, arrayOf, shape, number, oneOfType, func } from 'prop-types'

const CumulativeTable = ({ categoryName, data, onClickCourse }) => (
  <Table>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell content={categoryName} />
        <Table.HeaderCell content="Passed" />
        <Table.HeaderCell content="Failed" />
        <Table.HeaderCell content="Pass rate" />
      </Table.Row>
    </Table.Header>
    <Table.Body>
      { data.map(({ id, category, passed, failed, passrate }) => (
        <Table.Row key={id}>
          <Table.Cell content={category} onClick={() => onClickCourse(id)} />
          <Table.Cell content={passed} />
          <Table.Cell content={failed} />
          <Table.Cell content={`${passrate || 0} %`} />
        </Table.Row>
        ))}
    </Table.Body>
  </Table>
)

CumulativeTable.propTypes = {
  categoryName: string.isRequired,
  data: arrayOf(shape({
    id: oneOfType([number, string]),
    category: oneOfType([number, string]),
    passed: oneOfType([number, string]),
    failed: oneOfType([number, string]),
    passrate: oneOfType([number, string])
  })).isRequired,
  onClickCourse: func.isRequired
}

export default CumulativeTable
