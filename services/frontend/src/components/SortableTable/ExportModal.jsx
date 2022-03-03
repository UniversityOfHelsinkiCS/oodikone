/* eslint-disable no-continue */
/* eslint-disable max-classes-per-file */

import React, { useState, useMemo } from 'react'
import { Modal, Table, Button, Checkbox } from 'semantic-ui-react'
import _ from 'lodash'
import xlsx from 'xlsx'
import { getDataItemType, getColumnValue, DataItemType, DataVisitor } from './common'

const getExportColumns = columns => {
  const stack = [...columns]

  const exportColumns = []

  while (stack.length > 0) {
    const [column] = stack.splice(0, 1)

    if (column.export === false) {
      continue
    }

    if (column.children && column.children.length > 0) {
      stack.splice(0, 0, ...column.children)
      continue
    }

    exportColumns.push(column)
  }

  return exportColumns
}

const flattenData = data => {
  const stack = [...data]
  const flat = []

  while (stack.length > 0) {
    const [item] = stack.splice(0, 1)

    if (getDataItemType(item) === DataItemType.Group) {
      stack.splice(0, 0, ...item.children)
    } else {
      flat.push(item)
    }
  }

  return flat
}

class ExportVisitor extends DataVisitor {
  constructor(columns) {
    super()
    this.columns = columns
    this.rows = []
  }

  visitRow(ctx) {
    const row = _.chain(this.columns)
      .map(column => [column.title, getColumnValue(ctx, column)])
      .fromPairs()
      .value()

    this.rows.push(row)
  }
}

class ValueSamplerVisitor extends DataVisitor {
  constructor(columns) {
    super()
    this.columns = columns
    this.values = _.fromPairs(_.map(columns, c => [c.key, new Set()]))
  }

  visitRow(ctx) {
    this.columns.forEach(column => {
      const value = getColumnValue(ctx, column)
      this.values[column.key].add(value)
    })
  }

  sample(n) {
    return _.chain(this.values)
      .mapValues(v => _.sampleSize([...v], n))
      .value()
  }
}

const ExportModal = ({ open, onOpen, onClose, data, columns }) => {
  const exportColumns = useMemo(() => getExportColumns(columns), [columns])
  const flatData = useMemo(() => flattenData(data), [data])
  const [selected, setSelected] = useState(_.uniq(_.map(exportColumns, 'key')))

  const sampledValues = useMemo(() => ValueSamplerVisitor.visit(data, exportColumns).sample(10), [exportColumns, data])

  const handleExport = () => {
    const columns = exportColumns.filter(ec => _.includes(selected, ec.title))
    const { rows } = ExportVisitor.visit(data, columns)
    const sheet = xlsx.utils.json_to_sheet(rows)
    const book = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(book, sheet)
    xlsx.writeFile(book, 'Oodikone_Export.xlsx')
  }

  const toggleSelection = key => {
    setSelected(prev => {
      const i = prev.indexOf(key)

      if (i > -1) {
        const n = [...prev]
        n.splice(i, 1)
        return n
      }
      return [...prev, key]
    })
  }

  return (
    <Modal onOpen={onOpen} onClose={onClose} open={open}>
      <Modal.Header>Export to Excel</Modal.Header>
      <Modal.Content>
        <p>
          Exporting {flatData.length} rows into an Excel (.xlsx) file. Choose which columns you want to include in the
          generated field from the list below.
        </p>

        <div>
          <Button
            onClick={() => setSelected(exportColumns.map(c => c.key))}
            disabled={selected.length === exportColumns.length}
          >
            Include all
          </Button>
          <Button onClick={() => setSelected([])} disabled={selected.length === 0}>
            Exclude all
          </Button>
        </div>

        <Table celled striped>
          <Table.Header>
            <Table.HeaderCell />
            <Table.HeaderCell>Column</Table.HeaderCell>
            <Table.HeaderCell>Sample Values</Table.HeaderCell>
          </Table.Header>
          <Table.Body>
            {exportColumns.map(column => (
              <Table.Row key={column.key} onClick={() => toggleSelection(column.key)} style={{ cursor: 'pointer' }}>
                <Table.Cell collapsing verticalAlign="middle">
                  <Checkbox checked={_.includes(selected, column.key)} />
                </Table.Cell>
                <Table.Cell collapsing>{column.title}</Table.Cell>
                <Table.Cell style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <div style={{ width: '0' }}>
                    {sampledValues[column.key].map(value => (
                      <span
                        style={{
                          border: '1px solid #dedede',
                          borderRadius: '3px',
                          padding: '0px 3px',
                          backgroundColor: '#f9fafb',
                          marginRight: '0.25em',
                          color: '#555',
                        }}
                      >
                        {column.formatValue ? column.formatValue(value) : `${value}`}
                      </span>
                    ))}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Modal.Content>
      <Modal.Actions>
        <Button content="Cancel" onClick={() => onClose()} />
        <Button primary content="Export" onClick={() => handleExport()} />
      </Modal.Actions>
    </Modal>
  )
}

export default ExportModal
