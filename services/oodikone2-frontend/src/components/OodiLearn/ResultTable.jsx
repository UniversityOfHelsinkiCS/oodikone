import React from 'react'
import { Table, Button } from 'semantic-ui-react'
import { arrayOf, shape, func, oneOfType, string, number } from 'prop-types'

const ResultTable = ({ results, idTitle, nameTitle }) => (results.length > 0) && (
  <Table>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell content={idTitle} />
        <Table.HeaderCell content={nameTitle} />
        <Table.HeaderCell />
      </Table.Row>
    </Table.Header>
    <Table.Body>
      { results.map(r => (
        <Table.Row key={r.id}>
          <Table.Cell content={r.id} />
          <Table.Cell content={r.name} />
          <Table.Cell width={1}>
            <Button size="mini" icon="eye" circular onClick={r.handleClick} />
          </Table.Cell>
        </Table.Row>))}
    </Table.Body>
  </Table>
)

ResultTable.propTypes = {
  idTitle: string,
  nameTitle: string,
  results: arrayOf(shape({
    id: oneOfType([number, string]),
    name: string,
    handleClick: func
  })).isRequired
}

ResultTable.defaultProps = {
  idTitle: 'ID',
  nameTitle: 'Name'
}

export default ResultTable
