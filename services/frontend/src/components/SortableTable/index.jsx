/* eslint-disable no-return-assign */

import React, { useState, useMemo, useReducer } from 'react'
import { Icon, Input, Dropdown } from 'semantic-ui-react'
import FigureContainer from 'components/FigureContainer'
import _ from 'lodash'
import produce from 'immer'

/* const ExportModal = ({ open, onOpen, onClose, data, columns }) => {
  const [selected, setSelected] = useState(_.uniq(_.map(columns, 'title')))

  const getColumnValue = (row, { getRowExportVal, getRowVal }) => getRowExportVal ? getRowExportVal(row) : getRowVal(row);

  const sampledValues = useMemo(
    () => _.chain(columns)
      .omit('parent')
      .map((column) => [column.title, _.sampleSize(data, 10).map((row) => getColumnValue(row, column))])
      .fromPairs()
      .value(),
    [columns, data],
  )

  const handleExport = () => {
    const transformRow = (row) => _.chain(columns)
      .filter(c => _.includes(selected, c.title))
      .map((column) => [column.title, getColumnValue(row, column)])
      .fromPairs()
      .value();

    const rows = data.map(transformRow);

    const sheet = xlsx.utils.json_to_sheet(rows);
    const book = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(book, sheet);
    xlsx.writeFile(book, 'Oodikone_Export.xlsx');
  };

  const toggleSelection = (key) => {
    setSelected(prev => {
      const i = prev.indexOf(key);

      if (i > -1) {
        const n = [...prev];
        n.splice(i, 1);
        return n;
      } else {
        return [...prev, key];
      }
    });
  };

  return (
    <Modal
      onOpen={onOpen}
      onClose={onClose}
      open={open}
    >
      <Modal.Header>Export to Excel</Modal.Header>
      <Modal.Content>
        <p>
          Exporting {data.length} rows into an Excel (.xlsx) file. Choose which columns you want to include in the generated field from the list below.
        </p>

        <Table celled striped>
          <Table.Header>
            <Table.HeaderCell />
            <Table.HeaderCell>Column</Table.HeaderCell>
            <Table.HeaderCell>Sample Values</Table.HeaderCell>
          </Table.Header>
          <Table.Body>
            {
              columns
                .filter(x => !x.parent)
                .map((column) => (
                  <Table.Row onClick={() => toggleSelection(column.title)} style={{ cursor: 'pointer' }}>
                    <Table.Cell collapsing verticalAlign='middle'>
                      <Checkbox checked={_.includes(selected, column.title)} />
                    </Table.Cell>
                    <Table.Cell collapsing>{column.title}</Table.Cell>
                    <Table.Cell style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <div style={{ width: '0' }}>
                        {sampledValues[column.title]
                          .map((value) => (
                            <span style={{
                              border: '1px solid #dedede',
                              borderRadius: '3px',
                              padding: '0px 3px',
                              backgroundColor: '#f9fafb',
                              marginRight: '0.25em',
                              color: '#555',
                            }}>{value}</span>
                          ))
                        }
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
            }
          </Table.Body>
        </Table>
      </Modal.Content>
      <Modal.Actions>
        <Button content="Export" onClick={() => handleExport()} />
      </Modal.Actions>
    </Modal>
  );
}; */

const computeColumnSpans = columns => {
  const stack = _.cloneDeep(columns)
  const spans = {}

  let i = 0
  let maxDepth = 0

  while (stack.length > 0) {
    const elem = stack[stack.length - 1]

    const currentDepth = elem.depth ?? 1

    maxDepth = Math.max(currentDepth, maxDepth)

    if (elem.start !== undefined) {
      spans[elem.key] = i - elem.start
      stack.pop()
    } else if (!elem.children || elem.children.length === 0) {
      i += 1
      spans[elem.key] = 1
      stack.pop()
    } else {
      elem.start = i
      let depth = currentDepth + 1

      if (elem.mergeHeader) {
        depth = currentDepth
      }

      elem.children.forEach(e => stack.push({ ...e, depth }))
    }
  }

  return [spans, maxDepth]
}

const getColumnValue = (row, columnDef) => (columnDef.getRowVal ? columnDef.getRowVal(row) : undefined)

const evaluateColumnFilters = (row, column, options) => {
  let defaultDiscard = false
  let result = null

  options.valueFilters.forEach(({ value, type }) => {
    const colValue = getColumnValue(row, column)
    if (type === 'include') {
      if (value === colValue) {
        result = true
      }

      defaultDiscard = true
    } else if (type === 'exclude' && value === colValue) {
      result = false
    }
  })

  if (result !== null) {
    return result
  }

  return !defaultDiscard
}

const evaluateFilters = (row, columnsByKey, state) => {
  return Object.entries(state.columnOptions).every(([column, options]) =>
    evaluateColumnFilters(row, columnsByKey[column], options)
  )
}

const sortRows = (rows, columnsByKey, state) => {
  const sortOption = _.chain(state.columnOptions)
    .toPairs()
    .find(([, opt]) => opt.sort)
    .value()

  if (!sortOption) {
    return rows
  }

  const [key, { sort }] = sortOption

  return _.orderBy(rows, [r => getColumnValue(r, columnsByKey[key])], [sort])
}

const groupRows = (data, groupBy, columnsByKey, state) => {
  const pre = _.chain(data)
    .filter(row => evaluateFilters(row, columnsByKey, state))
    .thru(rows => sortRows(rows, columnsByKey, state))
    .value()

  if (!groupBy) {
    return { grouped: false, rows: pre }
  }

  let groups = _.chain(pre)
    .groupBy(data, row => getColumnValue(row, columnsByKey[groupBy[0]]))
    .value()

  if (groupBy.length > 1) {
    groups = _.chain(groups)
      .values()
      .map(rows => groupRows(rows, _.slice(groupBy, 1), columnsByKey))
      .value()

    return { grouped: true, groups }
  }

  return { grouped: true, groups: _.values(groups) }
}

const ColumnContent = ({ column, data }) => {
  try {
    if (column.getRowContent) {
      return column.getRowContent(data)
    }

    const value = column.getRowVal(data)

    if (column.formatValue) {
      return column.formatValue(value)
    }

    return value
  } catch (e) {
    return 'Error'
  }
}

const Row = ({ data, columns, columnSpans }) => {
  const cells = []

  const stack = _.clone(columns)

  while (stack.length > 0) {
    const [column] = stack.splice(0, 1)

    const value = getColumnValue(data, column)
    const content = column.getRowContent && column.getRowContent(data)

    const cellProps = {}

    if (column.parent?.merge) {
      cellProps.style = { borderLeft: 'none' }
    }

    if (value || content) {
      cells.push(
        <td colSpan={columnSpans[column.key]} {...cellProps}>
          <ColumnContent column={column} data={data} />
        </td>
      )
    } else if (column.children && column.children.length > 0) {
      stack.splice(0, 0, ...column.children)
    } else {
      cells.push(<td {...cellProps} />)
    }
  }

  return <tr>{cells}</tr>
}

const RowGroup = ({ content, columns, columnsByKey, columnSpans }) => {
  if (!content.grouped) {
    return content.rows.map(row => (
      <Row data={row} columns={columns} columnsByKey={columnsByKey} columnSpans={columnSpans} />
    ))
  }

  return <></>
}

const ColumnHeader = ({ column, state, dispatch, values }) => {
  const { valueFilters, sort } = state

  const [search, setSearch] = useState('')

  if (!column.title) {
    return <></>
  }

  const filterColumnKey = column.mergeHeader ? column.children[0].key : column.key

  const sortIcon = { desc: 'sort down', asc: 'sort up' }[sort] ?? 'sort'

  return (
    <div
      style={{ display: 'flex', alignItems: 'center' }}
      onClick={() =>
        dispatch({
          type: 'TOGGLE_COLUMN_SORT',
          payload: { column: filterColumnKey },
        })
      }
    >
      <span style={{ flexGrow: 1, marginRight: '0.5em' }}>{column.title}</span>
      <Icon name={sortIcon} style={{ color: sort ? 'rgb(33, 133, 208)' : '#bbb', position: 'relative', top: '-1px' }} />
      {(!column.children || column.children.length === 0 || column.mergeHeader) && (
        <Dropdown
          icon="filter"
          style={{ color: valueFilters.length > 0 ? 'rgb(33, 133, 208)' : '#bbb', top: '1px' }}
          closeOnChange={false}
        >
          <Dropdown.Menu>
            <Input
              icon="search"
              iconPosition="left"
              onClick={e => e.stopPropagation()}
              value={search}
              onChange={evt => setSearch(evt.target.value)}
            />
            <Dropdown.Menu scrolling>
              {values
                .filter(value => search === '' || `${value}`.indexOf(search) > -1)
                .map(value => {
                  let icon = 'square outline'

                  const filter = valueFilters.find(f => f.value === value)

                  if (filter) {
                    if (filter.type === 'exclude') {
                      icon = 'minus square outline'
                    } else if (filter.type === 'include') {
                      icon = 'plus square outline'
                    }
                  }

                  const text = column.formatValue ? column.formatValue(value) : value

                  return (
                    <Dropdown.Item
                      icon={icon}
                      text={text}
                      onClick={evt => {
                        dispatch({ type: 'CYCLE_VALUE_FILTER', payload: { column: filterColumnKey, value } })
                        evt.preventDefault()
                        evt.stopPropagation()
                      }}
                    />
                  )
                })}
            </Dropdown.Menu>
            <Dropdown.Divider />
            <Dropdown.Item
              active={sort === 'asc'}
              onClick={() =>
                dispatch({ type: 'TOGGLE_COLUMN_SORT', payload: { column: filterColumnKey, direction: 'asc' } })
              }
            >
              Sort: Ascending
            </Dropdown.Item>
            <Dropdown.Item
              active={sort === 'desc'}
              onClick={() =>
                dispatch({ type: 'TOGGLE_COLUMN_SORT', payload: { column: filterColumnKey, direction: 'desc' } })
              }
            >
              Sort: Descending
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      )}
    </div>
  )
}

const getDefaultColumnOptions = () => ({
  valueFilters: [],
})

const createHeaders = (columns, columnSpans, columnDepth, columnOptions, dispatch, values) => {
  let stack = _.clone(columns)
  const rows = _.range(0, columnDepth).map(() => [])

  while (stack.length > 0) {
    const [column] = stack.splice(0, 1)

    if (column.parent?.mergeHeader) {
      continue; // eslint-disable-line
    }

    const currentDepth = column.depth ?? 0
    const rowspan = column.children && column.children.length > 0 ? 1 : columnDepth - currentDepth

    const style = {}

    if (column.merged) {
      style.borderLeft = 'none'
    }

    const valuesKey = column.mergeHeader ? column.children[0].key : column.key

    rows[currentDepth].push(
      <th colSpan={columnSpans[column.key]} rowSpan={rowspan} style={style}>
        <ColumnHeader
          column={column}
          state={columnOptions[valuesKey] ?? getDefaultColumnOptions()}
          dispatch={dispatch}
          values={values[valuesKey] ?? []}
        />
      </th>
    )

    if (column.children) {
      const children = column.children.map(c => ({ ...c, depth: currentDepth + 1 }))
      stack = [...children, ...stack]
    }
  }

  return rows.map(cells => <tr>{cells}</tr>)
}

const getInitialState = () => ({
  columnOptions: {},
})

const tableStateReducer = produce((state, { type, payload }) => {
  ;({
    CYCLE_VALUE_FILTER: () => {
      if (!state.columnOptions[payload.column]) {
        state.columnOptions[payload.column] = getDefaultColumnOptions()
      }

      const existingIndex = state.columnOptions[payload.column].valueFilters.findIndex(vf => vf.value === payload.value)
      const existing = state.columnOptions[payload.column].valueFilters[existingIndex]

      if (existing) {
        if (existing.type === 'include') {
          existing.type = 'exclude'
        } else {
          state.columnOptions[payload.column].valueFilters.splice(existingIndex, 1)
        }
      } else {
        state.columnOptions[payload.column].valueFilters.push({ value: payload.value, type: 'include' })
      }
    },
    TOGGLE_COLUMN_SORT: () => {
      if (!state.columnOptions[payload.column]) {
        state.columnOptions[payload.column] = getDefaultColumnOptions()
      }

      if (payload.direction) {
        if (state.columnOptions[payload.column].sort === payload.direction) {
          state.columnOptions[payload.column].sort = undefined
        } else {
          state.columnOptions[payload.column].sort = payload.direction
        }
      } else {
        const cycle = [undefined, 'desc', 'asc']
        const index = cycle.indexOf(state.columnOptions[payload.column].sort)
        const value = cycle[(index + 1) % (cycle.length + 1)]
        state.columnOptions[payload.column].sort = value
      }

      Object.entries(state.columnOptions)
        .filter(([key]) => key !== payload.column)
        .forEach(([, value]) => (value.sort = undefined))
    },
  }[type]())
})

const getColumnValues = (data, columns) => {
  return _.chain(columns)
    .flatMapDeep(column => {
      const values = _.chain(data)
        .map(row => getColumnValue(row, column))
        .uniq()
        .value()

      return [
        { key: column.key, values },
        column.children
          ? _.toPairs(getColumnValues(data, column.children)).map(([key, values]) => ({ key, values }))
          : [],
      ]
    })
    .map(({ key, values }) => [key, values])
    .fromPairs()
    .value()
}

const injectParentPointers = (columns, parent) => {
  const byKey = {}

  const newColumns = columns.map(col => {
    let c = { ...col, parent }

    if (col.children) {
      const [children, byKeyChildren] = injectParentPointers(col.children, col)

      Object.assign(byKey, byKeyChildren)

      c = { ...col, parent, children }
    }

    byKey[c.key] = c

    return c
  })

  return [newColumns, byKey]
}

const SortableTable = ({ columns: pColumns, title, data, groupBy, style, actions, noHeader, contextMenuItems }) => {
  const [state, dispatch] = useReducer(tableStateReducer, null, getInitialState)
  const [columns, columnsByKey] = useMemo(() => injectParentPointers(pColumns), [pColumns])
  const [columnSpans, columnDepth] = useMemo(() => computeColumnSpans(columns), [columns])

  const values = useMemo(() => getColumnValues(data, columns), [data, columns])
  const headers = useMemo(
    () => createHeaders(columns, columnSpans, columnDepth, state.columnOptions, dispatch, values),
    [columns, columnSpans, columnDepth, state.columnOptions, dispatch, values]
  )

  const groupedRows = useMemo(() => groupRows(data, groupBy, columnsByKey, state), [data, groupBy, columnsByKey, state])

  const content = (
    <table
      className="ui table single line collapsing basic striped celled"
      style={!noHeader ? { borderRadius: 0, borderLeft: 'none', borderTop: 'none', background: 'white' } : {}}
    >
      <thead>{headers}</thead>
      <tbody>
        <RowGroup content={groupedRows} columns={columns} columnsByKey={columnsByKey} columnSpans={columnSpans} />
      </tbody>
    </table>
  )

  if (noHeader) {
    return content
  }

  return (
    <FigureContainer style={style}>
      <FigureContainer.Header actions={actions} contextMenuItems={contextMenuItems}>
        <Icon style={{ color: '#c2c2c2', position: 'relative', top: '1px', marginRight: '0.5em' }} name="table" />{' '}
        {title}
      </FigureContainer.Header>
      <FigureContainer.Content style={{ padding: 0, overflow: 'auto', backgroundColor: '#e8e8e91c' }}>
        {content}
      </FigureContainer.Content>
    </FigureContainer>
  )
}

export default SortableTable
