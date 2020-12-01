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

const PopulationCourseTable = ({
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
  const [collapsed, setCollapsed] = useState(initialCollapsing(columns))
  const [columnsWithCollapsedHeaders, setColumnsWithCollapsedHeaders] = useState(columns)
  const [sortedRows, setSortedRows] = useState(data)
  const chunkedData = useChunk(data, chunkifyBy)

  const handleSort = column => () => {
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
      return chunkedData
    }
    const { getRowVal } = column
    const sorted = sortBy(chunkedData, [getRowVal])
    return setSortedRows(direction === DIRECTIONS.ASC ? sorted : sorted.reverse())
  }, [columns, columnsWithCollapsedHeaders])

  useEffect(() => {
    setColumnsWithCollapsedHeaders(
      collapsingHeaders
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
        {columnsWithCollapsedHeaders.length > 0 && (
          <Table.Row>
            {columnsWithCollapsedHeaders
              .filter(c => !c.child && !(c.title == null))
              .map(c => (
                <Table.HeaderCell
                  key={c.key}
                  content={c.title}
                  onClick={
                    c.parent && collapsingHeaders && c.key !== 'general'
                      ? handleCollapse(intoCollapsing(c))
                      : handleSort(c.key)
                  }
                  sorted={c.parent ? undefined : sortDirection(c.key)}
                  {...c.headerProps}
                />
              ))}
          </Table.Row>
        )}
        <Table.Row>
          {columns
            .filter(c => c.child && !(c.title == null) && !collapsed[c.childOf])
            .map(c => (
              <Table.HeaderCell
                key={c.key}
                content={c.title}
                onClick={handleSort(c.key)}
                sorted={sortDirection(c.key)}
                {...c.headerProps}
              />
            ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedRows.map(row => (
          <Table.Row key={getRowKey(row)} {...(getRowProps && getRowProps(row))}>
            {columns
              .filter(c => !c.parent)
              .map(c => {
                if (collapsed[c.childOf]) {
                  return null
                }
                if (c.key.includes('programmecode') || c.key.includes('programmename')) {
                  return (
                    <Table.Cell
                      width={c.key === 'programmecode' ? '1' : '16'}
                      key={c.key}
                      content={c.getRowContent ? c.getRowContent(row) : c.getRowVal(row)}
                      {...c.cellProps}
                      {...(c.getCellProps && c.getCellProps(row))}
                    />
                  )
                }
                return (
                  <Table.Cell
                    key={c.key}
                    content={c.getRowContent ? c.getRowContent(row) : c.getRowVal(row)}
                    {...c.cellProps}
                    {...(c.getCellProps && c.getCellProps(row))}
                  />
                )
              })}
            {Object.values(collapsed).map(e => (
              <Table.Cell className="tableCell" key={e.key} warning />
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}

PopulationCourseTable.propTypes = {
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

PopulationCourseTable.defaultProps = {
  tableProps: undefined,
  getRowProps: undefined,
  defaultdescending: false,
  defaultsortkey: null,
  collapsingHeaders: false,
  showNames: undefined,
  chunkifyBy: undefined
}

export default PopulationCourseTable
