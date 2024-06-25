import { map, includes, uniq } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Modal, Table } from 'semantic-ui-react'
import { utils, writeFile } from 'xlsx'

import { getTimestamp } from '@/common/timeAndDate'
import { cloneColumns, DataItemType, getColumnTitle, getDataItemType } from './common'
import { ExportVisitor } from './visitors/ExportVisitor'
import { ValueVisitor } from './visitors/ValueVisitor'

const getExportColumns = columns => {
  const stack = cloneColumns(columns)

  const exportColumns = []

  while (stack.length > 0) {
    const [column] = stack.splice(0, 1)

    const parents = column.parents ?? []

    if (column.export === false) {
      continue
    }

    if (column.children && column.children.length > 0) {
      stack.splice(0, 0, ...column.children.map(child => ({ ...child, parents: [...parents, column] })))
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

export const ExportModal = ({ open, onOpen, onClose, data, columns, featureName }) => {
  const exportColumns = useMemo(() => getExportColumns(columns), [columns])
  const flatData = useMemo(() => flattenData(data), [data])
  const [selected, setSelected] = useState(uniq(map(exportColumns, 'key')))

  useEffect(() => {
    setSelected(uniq(map(exportColumns, 'key')))
  }, [exportColumns])

  const sampledValues = useMemo(
    () => ValueVisitor.visit(data, exportColumns, { exportMode: true }).sample(10),
    [exportColumns, data]
  )

  const handleExport = () => {
    const columns = exportColumns.filter(ec => includes(selected, ec.key))
    const { rows } = ExportVisitor.visit(data, columns)
    const sheet = utils.json_to_sheet(rows)
    const book = utils.book_new()
    utils.book_append_sheet(book, sheet)
    writeFile(book, `oodikone_${featureName}_${getTimestamp()}.xlsx`)
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
    <Modal onClose={onClose} onOpen={onOpen} open={open}>
      <Modal.Header>Export to Excel</Modal.Header>
      <Modal.Actions>
        <Button content="Cancel" onClick={() => onClose()} />
        <Button content="Export" onClick={() => handleExport()} primary />
      </Modal.Actions>
      <Modal.Content>
        <p>
          Exporting {flatData.length} rows into an Excel (.xlsx) file. Choose which columns you want to include in the
          generated field from the list below.
        </p>
        <div>
          <Button
            disabled={selected.length === exportColumns.length}
            onClick={() => setSelected(exportColumns.map(column => column.key))}
          >
            Include all
          </Button>
          <Button disabled={selected.length === 0} onClick={() => setSelected([])}>
            Exclude all
          </Button>
        </div>
        <Table celled striped>
          <Table.Header>
            <Table.Row key="TitleRow">
              <Table.HeaderCell />
              <Table.HeaderCell>Column</Table.HeaderCell>
              <Table.HeaderCell>Sample values</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {exportColumns.map(column => (
              <Table.Row key={column.key} onClick={() => toggleSelection(column.key)} style={{ cursor: 'pointer' }}>
                <Table.Cell collapsing verticalAlign="middle">
                  <Checkbox checked={includes(selected, column.key)} />
                </Table.Cell>
                <Table.Cell collapsing>{getColumnTitle(column)}</Table.Cell>
                <Table.Cell style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <div style={{ width: '0' }}>
                    {sampledValues[column.key].map(value => (
                      <span
                        key={crypto.randomUUID()}
                        style={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #dedede',
                          borderRadius: '3px',
                          color: '#555',
                          marginRight: '0.25em',
                          padding: '0px 3px',
                        }}
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Modal.Content>
    </Modal>
  )
}
