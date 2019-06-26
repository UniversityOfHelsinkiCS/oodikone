import React, { Component, Fragment } from 'react'
import { Table } from 'semantic-ui-react'
import { shape, arrayOf, string, func, bool, element, oneOfType } from 'prop-types'
import _ from 'lodash'

const DIRECTIONS = {
  ASC: 'ascending',
  DESC: 'descending'
}

class SortableTable extends Component {
  state = {
    direction: this.props.defaultdescending ? DIRECTIONS.DESC : DIRECTIONS.ASC,
    selected: this.props.defaultsortkey == null ? this.props.columns[0].key : this.props.defaultsortkey,
    collapsed: []
  }

  handleSort = column => () => {
    const { selected, direction } = this.state
    if (selected === column) {
      this.setState({
        direction: direction === DIRECTIONS.ASC ? DIRECTIONS.DESC : DIRECTIONS.ASC
      })
    } else {
      this.setState({
        selected: column,
        direction: DIRECTIONS.DESC
      })
    }
  }

  handleCollapse = column => () => {
    const { collapsed } = this.state
    if (collapsed.map(c => c.headerProps.title).includes(column.headerProps.title)) {
      this.setState({ collapsed: [...collapsed.filter(c => c.headerProps.title !== column.headerProps.title)] })
    } else {
      this.setState({ collapsed: [...collapsed, column] })
    }
  }

  sortedRows = () => {
    const { selected, direction } = this.state
    const column = this.props.columns.find(c => c.key === selected)
    if (!column) {
      return this.props.data
    }
    const { getRowVal } = column
    const sorted = _.sortBy(this.props.data, [getRowVal])
    return direction === DIRECTIONS.ASC ? sorted : sorted.reverse()
  }

  verticalTitle = title => (
    // https://stackoverflow.com/a/41396815
    <div style={{ writingMode: 'vertical-rl', minWidth: '32px', textAlign: 'left' }}>
      {title}
    </div>
  )


  render() {
    const calculateSkippedColumns = () => {
      const { columns, showNames } = this.props
      const { collapsed } = this.state
      const defaultColumnCount = showNames ? 6 : 3
      if (collapsed) {
        const collapsedOrderNumbers = collapsed.map(c => c.headerProps.ordernumber)
        return collapsedOrderNumbers.reduce((acc, curr) => {
          const previousCols = columns.filter(c => c.headerProps && c.headerProps.ordernumber < curr)
          const sumOfPreviousColSpans = previousCols.reduce((a, b) => a + b.headerProps.colSpan, 0)
          return [
            ...acc,
            sumOfPreviousColSpans + columns.find(c => c.headerProps && c.headerProps.ordernumber === curr).headerProps.colSpan + defaultColumnCount]
        }, [])
      }
      return []
    }
    const { tableProps, getRowProps, columns, getRowKey, collapsingHeaders } = this.props
    const { selected, direction, collapsed } = this.state
    const columnsWithCollapsedHeaders = collapsingHeaders ? [...columns.filter(c => (
      c.headerProps && (!collapsed.map(cell => cell.headerProps.title).includes(c.headerProps.title) && !c.collapsed))),
    ...this.state.collapsed].sort((a, b) => a.headerProps.ordernumber - b.headerProps.ordernumber)
      :
      columns

    const sortDirection = name => (selected === name ? direction : null)

    return (
      <Table sortable {...tableProps}>
        <Table.Header>
          <Table.Row>
            {columnsWithCollapsedHeaders.filter(c => !c.child && !(c.title == null)).map(c => (
              <Table.HeaderCell
                key={c.key}
                content={c.title}
                onClick={c.parent && collapsingHeaders ? this.handleCollapse({ title: this.verticalTitle(<Fragment>{c.headerProps.title}</Fragment>), headerProps: { ...c.headerProps, colSpan: 1, rowSpan: 2 }, key: c.key, collapsed: true, parent: c.parent }) : this.handleSort(c.key)}
                sorted={c.parent ? undefined : sortDirection(c.key)}
                {...c.headerProps}
              />
            ))
            }
          </Table.Row>
          <Table.Row>
            {columns.filter(c => c.child && !(c.title == null) && !collapsed.map(cell => cell.headerProps.title).includes(c.childOf)).map(c =>
              (
                <Table.HeaderCell
                  key={c.key}
                  content={c.title}
                  onClick={this.handleSort(c.key)}
                  sorted={sortDirection(c.key)}
                  {...c.headerProps}
                />
              ))
            }
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {this.sortedRows().map(row => (
            <Table.Row
              key={getRowKey(row)}
              {...getRowProps && getRowProps(row)}
            >
              {columns.filter(c => !c.parent).map((c, i) => {
                if (collapsed.map(cell => cell.headerProps.title).includes(c.childOf)) {
                  const skippedColumns = calculateSkippedColumns()
                  if (skippedColumns.includes(i + 1)) {
                    return <Table.Cell warning />
                  }
                  return null
                }
                return (
                  <Table.Cell
                    key={c.key}
                    content={c.getRowContent ? c.getRowContent(row) : c.getRowVal(row)}
                    {...c.cellProps}
                    {...c.getCellProps && c.getCellProps(row)}
                  />
                )
              })
              }
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    )
  }
}

SortableTable.propTypes = {
  tableProps: shape({}),
  getRowKey: func.isRequired,
  getRowProps: func,
  columns: arrayOf(shape({
    key: string.isRequired,
    title: oneOfType([element, string]),
    headerProps: shape({}),
    getRowVal: func,
    getRowContent: func,
    getCellProps: func,
    cellProps: shape({}),
    group: bool,
    children: arrayOf()
  })).isRequired,
  data: arrayOf(shape({})).isRequired,
  defaultdescending: bool,
  defaultsortkey: string,
  collapsingHeaders: bool,
  showNames: bool
}

SortableTable.defaultProps = {
  tableProps: undefined,
  getRowProps: undefined,
  defaultdescending: false,
  defaultsortkey: null,
  collapsingHeaders: false,
  showNames: undefined
}

export default SortableTable
