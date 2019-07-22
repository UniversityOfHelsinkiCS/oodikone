import React from 'react'
import { Table } from 'semantic-ui-react'
import { shape } from 'prop-types'

const preStyle = {
  overflow: 'auto',
  maxHeight: '25em',
  wordBreak: 'break-all',
  whiteSpace: 'pre-wrap'
}

const KeyValueTable = ({ data }) => (
  <Table celled className="fixed-header">
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell content="Key" width={2} textAlign="center" />
        <Table.HeaderCell content="Value" width={14} textAlign="left" />
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {Object.entries(data).map(([key, value]) => (
        <Table.Row key={key}>
          <Table.Cell content={key} textAlign="center" />
          <Table.Cell textAlign="left">
            <pre style={preStyle}>
              {JSON.stringify(value, null, 2)}
            </pre>
          </Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table>
)

KeyValueTable.propTypes = {
  data: shape({}).isRequired
}

export default KeyValueTable
