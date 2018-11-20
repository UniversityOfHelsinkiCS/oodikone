import React, { Component } from 'react'
import { Table } from 'semantic-ui-react'
import { shape, arrayOf, string, func, bool } from 'prop-types'
import _ from 'lodash'

const DIRECTIONS = {
    ASC: 'ascending',
    DESC: 'descending'
}

class SortableTable extends Component {
    state={
        direction: DIRECTIONS.DESC,
        selected: this.props.columns[0].key
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
      const { getRowVal } = column
      const sorted = _.sortBy(this.props.data, [getRowVal])
      return direction === DIRECTIONS.ASC ? sorted : sorted.reverse()
    }

    render() {
      const { tableProps, columns, data, getRowKey } = this.props
      const { selected, direction } = this.state
      const sortDirection = name => selected === name ? direction : null
      return (
          <Table sortable {...tableProps}>
            <Table.Header>
                <Table.Row>
                    {columns.map(c => (
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
                    <Table.Row key={getRowKey(row)}>
                        {columns.map(c => (
                            <Table.Cell
                              key={c.key}
                              content={c.getRowContent ? c.getRowContent(row) : c.getRowVal(row)}
                              {...c.cellProps}
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
  columns: arrayOf(shape({
      key: string,
      title: string,
      headerProps: shape({}),
      getRowVal: func,
      getRowContent: func,
      cellProps: shape({})
  })).isRequired,
  data: arrayOf(shape({})).isRequired
}

SortableTable.defaultProps = {
    tableProps: undefined
}

export default SortableTable
