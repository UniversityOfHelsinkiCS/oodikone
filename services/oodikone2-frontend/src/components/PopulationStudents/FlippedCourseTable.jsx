import React, { useState, useEffect } from 'react'
import { Table } from 'semantic-ui-react'
import { shape, arrayOf, string, func, bool, element, oneOfType } from 'prop-types'
import { sortBy } from 'lodash'
import { useChunk } from '../../common/hooks'
import './populationStudents.css'

const verticalTitle = title => {
  // https://stackoverflow.com/a/41396815
  return <div className="tableVerticalTitle">{title}</div>
}

const intoCollapsing = column => ({
  title: verticalTitle(column.headerProps.title),
  headerProps: { ...column.headerProps, colSpan: 1, rowSpan: 2 },
  key: column.key,
  collapsed: true,
  parent: column.parent
})

const initialCollapsing = columns => {
  const coll = {}
  columns.forEach(column => {
    if (!column.parent || column.key === 'general') return

    coll[column.headerProps.title] = intoCollapsing(column)
  })
  return coll
}

const DIRECTIONS = {
  ASC: 'ascending',
  DESC: 'descending'
}

const FlippedCourseTable = ({
  defaultdescending,
  defaultsortkey,
  columns,
  data,
  tableProps,
  getRowProps,
  getRowKey,
  collapsingHeaders,
  chunkifyBy
}) => {
  const [direction, setDirection] = useState(defaultdescending ? DIRECTIONS.DESC : DIRECTIONS.ASC)
  const [selected, setSelected] = useState(defaultsortkey == null ? columns[0].key : defaultsortkey)
  const [collapsed, setCollapsed] = useState(columns)
  const [columnsWithCollapsedHeaders, setColumnsWithCollapsedHeaders] = useState(columns)
  const [sortedRows, setSortedRows] = useState(data)
  const chunkedData = useChunk(data, chunkifyBy)

  const handleSort = column => {
    if (selected === column) {
      setDirection(direction === DIRECTIONS.ASC ? DIRECTIONS.DESC : DIRECTIONS.ASC)
    } else {
      setSelected(column)
      setDirection(DIRECTIONS.DESC)
    }
  }

  const handleCollapse = column => () => {
    const { title } = column.headerProps

    if (collapsed[title]) {
      const { [title]: _, ...rest } = collapsed
      setCollapsed(rest)
    } else {
      setCollapsed({ ...collapsed, [title]: column })
    }
  }

  useEffect(() => {
    const column = columns.find(c => c.key === selected)
    if (!column) {
      setSortedRows(chunkedData)
      return
    }
    const { getRowVal } = column
    const sorted = sortBy(chunkedData, [getRowVal])
    setSortedRows(direction === DIRECTIONS.ASC ? sorted : sorted.reverse())
  }, [selected])

  useEffect(() => {
    setColumnsWithCollapsedHeaders(
      !collapsingHeaders
        ? columns
            .filter(c => c.headerProps && (!collapsed[c.headerProps.title] && !c.collapsed))
            .sort((a, b) => a.headerProps.ordernumber - b.headerProps.ordernumber)
            .concat(Object.values(collapsed).sort((a, b) => a.headerProps.ordernumber - b.headerProps.ordernumber))
        : columns
    )
  }, [collapsed])

  const sortDirection = name => (selected === name ? direction : null)

  return (
    <Table sortable {...tableProps} className="fixed-header" striped>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell key="general" content={<b>Labels:</b>} style={{ textAlign: 'right' }} />
          {sortedRows
            .filter(row => row.studentNumber)
            .map(row => (
              <Table.HeaderCell
                className="rotatedTableHeader"
                key={getRowKey(row)}
                content={verticalTitle(row.studentNumber)}
              />
            ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {columns
          .filter(col => col.cellProps)
          .filter(col => data[0][col.code] && data[0][col.code] > 0)
          .map(col => (
            <Table.Row key={col.key}>
              <Table.Cell key="name" content={col.title} onClick={() => handleSort(col.key)} />

              {sortedRows
                .filter(row => row.studentNumber)
                .map(row => (
                  <Table.Cell key={getRowKey(row)} content={col.getRowContent(row)} />
                ))}
            </Table.Row>
          ))}
      </Table.Body>
    </Table>
  )
}

FlippedCourseTable.propTypes = {
  tableProps: shape({}),
  getRowKey: func.isRequired,
  getRowProps: func,
  columns: arrayOf(
    shape({
      key: string.isRequired,
      title: oneOfType([element, string]),
      headerProps: shape({}),
      getRowVal: func,
      getRowContent: func,
      getCellProps: func,
      cellProps: shape({}),
      group: bool,
      children: arrayOf()
    })
  ).isRequired,
  data: arrayOf(shape({})).isRequired,
  defaultdescending: bool,
  defaultsortkey: string,
  collapsingHeaders: bool,
  showNames: bool,
  chunkifyBy: string
}

FlippedCourseTable.defaultProps = {
  tableProps: undefined,
  getRowProps: undefined,
  defaultdescending: false,
  defaultsortkey: null,
  collapsingHeaders: false,
  showNames: undefined,
  chunkifyBy: undefined
}

export default FlippedCourseTable
