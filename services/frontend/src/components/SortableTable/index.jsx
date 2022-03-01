/* eslint-disable no-return-assign */

import React, { useState, useMemo, useReducer, createContext, useContext, useCallback } from 'react'
import { Icon, Input, Dropdown } from 'semantic-ui-react'
import FigureContainer from 'components/FigureContainer'
import _ from 'lodash'
import produce from 'immer'

const SortableTableContext = createContext(null)

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

const createRowSortingFunction = (columnsByKey, state) => {
  const sortByColumn = Object.entries(state.columnOptions).find(([, options]) => options.sort)

  if (!sortByColumn) {
    return undefined
  }

  const [columnKey, { sort }] = sortByColumn
  const column = columnsByKey[columnKey]

  if (sort === 'desc') {
    return (a, b) => {
      const va = getColumnValue(a, column)
      const vb = getColumnValue(b, column)

      if (va === vb) {
        return 0
      }
      if (va < vb) {
        return 1
      }
      return -1
    }
  }
  return (a, b) => {
    const va = getColumnValue(a, column)
    const vb = getColumnValue(b, column)

    if (va === vb) {
      return 0
    }
    if (va < vb) {
      return -1
    }
    return 1
  }
}

const ValueFilterType = {
  Include: 'include',
  Exclude: 'exclude',
}

const VALUE_FILTER_FUNCTIONS = {
  [ValueFilterType.Include]: (a, b) => (a === b ? true : null),
  [ValueFilterType.Exclude]: (a, b) => (a === b ? false : null),
}

const createRowFilteringFunction = (columnsByKey, state) => {
  const filters = _.chain(state.columnOptions)
    .toPairs()
    .filter(([, options]) => options.valueFilters.length > 0)
    .map(([column, { valueFilters }]) => {
      const defaultResult = !valueFilters.some(({ type }) => type === ValueFilterType.Include)

      return row => {
        const columnValue = getColumnValue(row, columnsByKey[column])

        return _.chain(valueFilters)
          .reduce((acc, { type, value }) => {
            const result = VALUE_FILTER_FUNCTIONS[type](columnValue, value)

            if (result === null) {
              return acc
            }

            return acc === null ? result : acc && result
          }, null)
          .thru(result => (result === null ? defaultResult : result))
          .value()
      }
    })
    // valueFilters.map(({ value, type }) => ({ column, value, type })))
    .value()

  return row => filters.every(func => func(row))
}

const DataItemTypeKey = Symbol('DATA_ITEM_TYPE')

const DataItemType = {
  Group: 'group',
  Row: 'row',
}

const getDataItemType = item => {
  if (item[DataItemTypeKey] === DataItemType.Group) {
    return DataItemType.Group
  }

  return DataItemType.Row
}

const filterAndSortRows = (items, predicate, orderFunc) => {
  return _.chain(items)
    .filter(item => getDataItemType(item) === DataItemType.Group || predicate(item))
    .thru(items => (orderFunc !== undefined ? items.sort(orderFunc) : items))
    .map(item => {
      if (getDataItemType(item) === DataItemType.Group) {
        return {
          ...item,
          children: filterAndSortRows(item.children, predicate, orderFunc),
        }
      }
      return item
    })
    .filter(item => getDataItemType(item) === DataItemType.Row || item.children.length > 0)
    .value()
}

const getCellContent = (column, data, isGroup, parents) => {
  if (column.getRowContent) {
    return column.getRowContent(data, isGroup, parents ?? [])
  }

  let value

  if (column.getRowVal) {
    value = column.getRowVal(data, isGroup, parents ?? [])
  }

  if (column.formatValue) {
    value = column.formatValue(value)
  }

  return value
}

const ColumnContent = ({ column, data, isGroup, parents }) => {
  try {
    return getCellContent(column, data, isGroup, parents)
  } catch (e) {
    return 'Error'
  }
}

const Row = ({ data, isGroup, parents }) => {
  const { columns, columnSpans } = useContext(SortableTableContext)

  const cells = []

  const stack = _.clone(columns)

  while (stack.length > 0) {
    const [column] = stack.splice(0, 1)

    let cellProps = {}

    if (column.parent?.merge && column.childIndex > 0) {
      cellProps = _.merge(cellProps, {
        style: { borderLeft: 'none' },
      })
    }

    if (column.cellStyle) {
      cellProps = _.merge(cellProps, {
        style: column.cellStyle,
      })
    }

    if (getCellContent(column, data, isGroup, parents)) {
      cells.push(
        <td colSpan={columnSpans[column.key]} {...cellProps}>
          <ColumnContent column={column} data={data} isGroup={isGroup} parents={parents} />
        </td>
      )
    } else if (column.children && column.children.length > 0) {
      stack.splice(0, 0, ...column.children)
    } else {
      cells.push(<td {...cellProps} />)
    }
  }

  return <tr className={isGroup ? 'group-header-row' : ''}>{cells}</tr>
}

const mergeColumnDefinitions = (original, overlay) => {
  const result = _.cloneDeep(original)

  if (!overlay) {
    return result
  }

  const byKey = {}

  const flattenColumns = column => {
    byKey[column.key] = column

    if (column.children) {
      column.children.forEach(flattenColumns)
    }
  }

  result.forEach(flattenColumns)

  Object.entries(overlay).forEach(([columnKey, overlayDef]) => {
    const orig = byKey[columnKey]

    if (orig !== undefined) {
      _.assign(orig, _.merge(orig, overlayDef))
    }
  })

  return result
}

const DataItem = ({ item, parents = [] }) => {
  const context = useContext(SortableTableContext)

  const type = getDataItemType(item)

  if (type === DataItemType.Row) {
    return <Row data={item} parents={parents} />
  }

  const overriddenContext = {
    ...context,
    columns: mergeColumnDefinitions(context.columns, item.definition.columnOverrides),
  }

  const headerRowData =
    typeof item.definition.headerRowData === 'function'
      ? item.definition.headerRowData(item)
      : item.definition.headerRowData

  const headerRow = (
    <SortableTableContext.Provider value={overriddenContext}>
      <Row data={headerRowData} isGroup parents={[item.definition, ...parents]} />
    </SortableTableContext.Provider>
  )

  const childRows = _.includes(context.state.expandedGroups, item.definition.key)
    ? item.children.map(child => <DataItem item={child} parents={[item.definition, ...parents]} />)
    : undefined

  return (
    <>
      {headerRow}
      {childRows}
    </>
  )
}

const ColumnHeader = ({ column, state, dispatch, values }) => {
  const { valueFilters, sort } = state

  const [search, setSearch] = useState('')

  const filterColumnKey = column.mergeHeader ? column.children[0].key : column.key

  const sortIcon = { desc: 'sort down', asc: 'sort up' }[sort] ?? 'sort'

  const valueItems = useMemo(() => {
    if (!values) {
      return []
    }

    const t = values
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
      })

    return t
  }, [values, search])

  if (!column.title) {
    return <></>
  }

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
            <Dropdown.Menu scrolling>{valueItems}</Dropdown.Menu>
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

    const rowspan =
      column.children && column.children.length > 0 && !column.mergeHeader ? 1 : columnDepth - currentDepth

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
          values={values[valuesKey]}
        />
      </th>
    )

    if (column.children && !column.mergeHeader) {
      const children = column.children.map(c => ({ ...c, depth: currentDepth + 1 }))
      stack = [...children, ...stack]
    }
  }

  return rows.map(cells => <tr>{cells}</tr>)
}

const getInitialState = () => ({
  columnOptions: {},
  expandedGroups: [],
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
    TOGGLE_GROUP: () => {
      const { group } = payload

      const index = state.expandedGroups.indexOf(group)

      if (index > -1) {
        state.expandedGroups.splice(index, 1)
      } else {
        state.expandedGroups.push(group)
      }
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

  const newColumns = columns.map((col, i) => {
    let c = { ...col, parent, childIndex: parent ? i : undefined }

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

export const group = (definition, children) => {
  return {
    definition,
    children,
    [DataItemTypeKey]: DataItemType.Group,
  }
}

const calculateGroupDepth = data => {
  return _.chain(data)
    .map(item => (getDataItemType(item) === DataItemType.Group ? 1 + calculateGroupDepth(item.children) : 0))
    .max()
    .value()
}

const filterNonGroupRows = data => {
  return _.chain(data)
    .flatMapDeep(item => {
      if (getDataItemType(item) === DataItemType.Group) {
        return filterNonGroupRows(item.children)
      }
      return item
    })
    .value()
}

const SortableTable = ({ columns: pColumns, title, data, style, actions, noHeader, contextMenuItems }) => {
  const [state, dispatch] = useReducer(tableStateReducer, null, getInitialState)
  const groupDepth = useMemo(() => calculateGroupDepth(data), [data])

  const toggleGroup = useCallback(
    groupKey => {
      dispatch({
        type: 'TOGGLE_GROUP',
        payload: { group: groupKey },
      })
    },
    [dispatch]
  )

  const tmpColumns = useMemo(() => {
    const columns = _.clone(pColumns)

    if (groupDepth > 0) {
      columns[0] = {
        key: '__group_parent',
        mergeHeader: true,
        merge: true,
        title: columns[0].title,
        children: [
          ..._.range(0, groupDepth).map(i => ({
            key: `__group_${i}`,
            getRowContent: (__, isGroup, parents) =>
              isGroup &&
              parents.length === i + 1 && (
                <Icon
                  name={`chevron ${_.includes(state.expandedGroups, parents[0].key) ? 'down' : 'right'}`}
                  style={{ margin: 0 }}
                  onClick={() => toggleGroup(parents[0].key)}
                />
              ),
            cellStyle: { paddingRight: 0 },
          })),
          columns[0],
        ],
      }
    }

    return columns
  }, [pColumns, groupDepth, toggleGroup, state])

  const [columns, columnsByKey] = useMemo(() => injectParentPointers(tmpColumns), [tmpColumns])

  const [columnSpans, columnDepth] = useMemo(() => computeColumnSpans(columns), [columns])

  const nonGroupRows = useMemo(() => filterNonGroupRows(data), [data])
  const values = useMemo(() => getColumnValues(nonGroupRows, columns), [data, columns])

  const headers = useMemo(
    () => createHeaders(columns, columnSpans, columnDepth, state.columnOptions, dispatch, values),
    [columns, columnSpans, columnDepth, state.columnOptions, dispatch, values]
  )

  const rowFilteringFunc = useMemo(() => createRowFilteringFunction(columnsByKey, state), [columnsByKey, state])
  const rowSortingFunc = useMemo(() => createRowSortingFunction(columnsByKey, state), [columnsByKey, state])

  const sortedData = useMemo(
    () => filterAndSortRows(data, rowFilteringFunc, rowSortingFunc),
    [data, rowFilteringFunc, rowSortingFunc]
  )

  const content = (
    <table
      className="ui table single line collapsing basic striped celled"
      style={
        !noHeader
          ? { borderRadius: 0, borderLeft: 'none', borderTop: 'none', background: 'white', margin: '1px' }
          : { margin: '1px' }
      }
    >
      <thead>{headers}</thead>
      <tbody>
        {sortedData.map(item => (
          <DataItem item={item} key={item.key} />
        ))}
      </tbody>
    </table>
  )

  if (noHeader) {
    return content
  }

  const context = {
    state,
    dispatch,
    values,
    columns,
    columnsByKey,
    columnSpans,
    columnDepth,
  }

  return (
    <SortableTableContext.Provider value={context}>
      <FigureContainer style={style}>
        <FigureContainer.Header actions={actions} contextMenuItems={contextMenuItems}>
          <Icon style={{ color: '#c2c2c2', position: 'relative', top: '1px', marginRight: '0.5em' }} name="table" />{' '}
          {title}
        </FigureContainer.Header>
        <FigureContainer.Content style={{ padding: 0, overflow: 'auto', backgroundColor: '#e8e8e91c' }}>
          {content}
        </FigureContainer.Content>
      </FigureContainer>
    </SortableTableContext.Provider>
  )
}

export default SortableTable
