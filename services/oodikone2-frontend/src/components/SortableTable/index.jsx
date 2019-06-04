import React, { Component } from 'react'
import { Table } from 'semantic-ui-react'
import { shape, arrayOf, string, func, bool, element, oneOfType } from 'prop-types'
import _ from 'lodash'

const DIRECTIONS = {
  ASC: 'ascending',
  DESC: 'descending'
}

class SortableTable extends Component {
    state={
      direction: this.props.defaultdescending ? DIRECTIONS.DESC : DIRECTIONS.ASC,
      selected: this.props.defaultsortkey == null ? this.props.columns[0].key : this.props.defaultsortkey
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

    render() {
      const { tableProps, getRowProps, columns, getRowKey } = this.props
      const { selected, direction } = this.state
      const sortDirection = name => (selected === name ? direction : null)
      return (
        <Table sortable {...tableProps}>
          <Table.Header>
            <Table.Row>
              {columns.filter(c => !c.child && !(c.title == null)).map(c => (
                <Table.HeaderCell
                  key={c.key}
                  content={c.title}
                  onClick={c.parent ? undefined : this.handleSort(c.key)}
                  sorted={c.parent ? undefined : sortDirection(c.key)}
                  {...c.headerProps}
                />
                ))
              }
            </Table.Row>
            <Table.Row>
              {columns.filter(c => c.child && !(c.title == null)).map(c => (
                <Table.HeaderCell
                  key={c.key}
                  content={c.title}
                  onClick={this.handleSort(c.key)}
                  sorted={sortDirection(c.key)}
                  {...c.headerProps}
                />
                ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            { this.sortedRows().map(row => (
              <Table.Row
                key={getRowKey(row)}
                {...getRowProps && getRowProps(row)}
              >
                {columns.filter(c => !c.parent).map(c => (
                  <Table.Cell
                    key={c.key}
                    content={c.getRowContent ? c.getRowContent(row) : c.getRowVal(row)}
                    {...c.cellProps}
                    {...c.getCellProps && c.getCellProps(row)}
                  />
                ))}
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
  defaultsortkey: string
}

SortableTable.defaultProps = {
  tableProps: undefined,
  getRowProps: undefined,
  defaultdescending: false,
  defaultsortkey: null
}

export default SortableTable
