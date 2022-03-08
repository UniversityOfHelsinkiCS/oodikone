/* eslint-disable no-return-assign */

import React, { useState, useMemo, useReducer, createContext, useContext, useCallback } from 'react'
import { Icon, Input, Dropdown } from 'semantic-ui-react'
import FigureContainer from 'components/FigureContainer'
import _ from 'lodash'
import produce from 'immer'
import ExportModal from './ExportModal'
import { group, getDataItemType, DataVisitor, DataItemType } from './common'

const SortableTableContext = createContext(null)

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
        let columnValues = getColumnValue(row, columnsByKey[column])

        if (!Array.isArray(columnValues)) {
          columnValues = [columnValues]
        }

        return _.chain(valueFilters)
          .reduce((acc, { type, value }) => {
            const result = columnValues.reduce((acc2, columnValue) => {
              if (acc2 !== null) {
                return acc2
              }

              return VALUE_FILTER_FUNCTIONS[type](columnValue, value)
            }, null)

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

  const resolveProp = value => {
    if (typeof value === 'function') {
      return value(data, isGroup, parents)
    }
    return value
  }

  const cells = []

  const stack = _.clone(columns)

  while (stack.length > 0) {
    const [column] = stack.splice(0, 1)

    let cellProps = resolveProp(column.cellProps) ?? {}

    if (column.parent?.merge && column.childIndex > 0) {
      cellProps = _.merge(cellProps, {
        style: { borderLeft: 'none', paddingLeft: 0 },
      })
    }

    if (column.cellStyle) {
      cellProps = _.merge(cellProps, {
        style: column.cellStyle,
      })
    }

    const content = getCellContent(column, data, isGroup, parents)

    if (content !== undefined && content !== null) {
      cells.push(
        <td colSpan={columnSpans[column.key]} {...cellProps}>
          <ColumnContent column={column} data={data} isGroup={isGroup} parents={parents} />
        </td>
      )
    } else if (column.children && column.children.length > 0) {
      stack.splice(0, 0, ...column.children.map((c, i) => ({ ...c, childIndex: i })))
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

const ColumnHeader = ({ column, state, dispatch, values, colSpan, rowSpan, style }) => {
  const { valueFilters, sort } = state

  const [search, setSearch] = useState('')

  const filterColumnKey = column.mergeHeader ? column.children[0].key : column.key

  const sortIcon = { desc: 'sort down', asc: 'sort up' }[sort] ?? 'sort'

  const sortable = column.sortable !== false
  const filterable = column.filterable !== false

  const valueItems = useMemo(() => {
    if (!values) {
      return []
    }

    const t = _.uniq(values)
      .filter(value => search === '' || `${value}`.indexOf(search) > -1)
      .sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b
        }
        if (a instanceof Date && b instanceof Date) {
          return a.getTime() - b.getTime()
        }
        return `${a}` - `${b}`
      })
      .map(value => {
        let icon = 'square outline'
        let color = 'inherit'

        const filter = valueFilters.find(f => f.value === value)

        if (filter) {
          if (filter.type === 'exclude') {
            icon = 'minus square outline'
            color = 'red'
          } else if (filter.type === 'include') {
            icon = 'plus square outline'
            color = 'green'
          }
        }

        const text = column.formatValue ? column.formatValue(value) : value

        return (
          <Dropdown.Item
            icon={<Icon name={icon} style={{ color }} />}
            text={text ? `${text}` : <span style={{ color: 'gray', fontStyle: 'italic' }}>Empty</span>}
            onClick={evt => {
              dispatch({ type: 'CYCLE_VALUE_FILTER', payload: { column: filterColumnKey, value } })
              evt.preventDefault()
              evt.stopPropagation()
            }}
          />
        )
      })

    return t
  }, [values, search, valueFilters])

  if (!column.title) {
    return <></>
  }

  const hasChildren = column.children && column.children.length > 0

  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={{
        ...style,
        cursor: sortable ? 'pointer' : 'initial',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center' }}
        onClick={() => {
          if (sortable) {
            dispatch({
              type: 'TOGGLE_COLUMN_SORT',
              payload: { column: filterColumnKey },
            })
          }
        }}
      >
        <span style={{ flexGrow: 1, marginRight: '0.5em' }}>{column.title}</span>
        {sortable && (!hasChildren || column.mergeHeader) && (
          <Icon
            name={sortIcon}
            style={{ color: sort ? 'rgb(33, 133, 208)' : '#bbb', position: 'relative', top: '-1px' }}
          />
        )}
        {filterable && (!hasChildren || column.mergeHeader) && (
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
    </th>
  )
}

const getDefaultColumnOptions = () => ({
  valueFilters: [],
})

const resolveDisplayColumn = column => {
  let displayColumn = null

  if (column.mergeHeader) {
    if (column.mergeHeader === true) {
      ;[displayColumn] = column.children
    } else if (typeof column.mergeHeader === 'string') {
      displayColumn = column.children.find(c => c.key === column.mergeHeader)
    }
  }

  if (displayColumn === null) {
    return column
  }

  return resolveDisplayColumn(displayColumn)
}

const createHeaders = (columns, columnSpans, columnDepth, columnOptions, dispatch, values) => {
  let stack = _.clone(columns)

  const rows = _.range(0, columnDepth).map(() => [])
  let i = 0

  while (stack.length > 0) {
    i += 1

    const [column] = stack.splice(0, 1)

    if (column.parent?.mergeHeader) {
      continue; // eslint-disable-line
    }

    const currentDepth = column.depth ?? 0

    const rowspan =
      column.children && column.children.length > 0 && !column.mergeHeader ? 1 : columnDepth - currentDepth

    const style = {
      backgroundColor: 'white',
    }

    if (rows[currentDepth].length === 0 && i > 1) {
      style.borderLeft = '1px solid rgba(34,36,38,.1)'
    }

    if (column.merged) {
      style.borderLeft = 'none'
    }

    if (!column.noHeader) {
      const displayColumn = resolveDisplayColumn(column)

      rows[currentDepth].push(
        <ColumnHeader
          colSpan={columnSpans[column.key]}
          rowSpan={rowspan}
          style={style}
          column={displayColumn}
          state={columnOptions[displayColumn.key] ?? getDefaultColumnOptions()}
          dispatch={dispatch}
          values={values[displayColumn.key]}
        />
      )
    }

    if (column.children && !column.mergeHeader) {
      const childDepth = column.noHeader ? currentDepth : currentDepth + 1
      const children = column.children.map(c => ({ ...c, depth: childDepth }))
      stack = [...children, ...stack]
    }
  }

  return rows.map(cells => <tr>{cells}</tr>)
}

const getInitialState = defaultSort => () => ({
  columnOptions: defaultSort ? { [defaultSort[0]]: { valueFilters: [], sort: defaultSort[1] } } : {},
  expandedGroups: [],
})

const tableStateReducer = (...args) =>
  produce((state, { type, payload }) => {
    ;({
      RESET_FILTERS: () => {
        state.columnOptions = getInitialState(...args)().columnOptions
      },
      SET_UNFOLDED_GROUPS: () => {
        state.expandedGroups = payload.groups
      },
      CYCLE_VALUE_FILTER: () => {
        if (!state.columnOptions[payload.column]) {
          state.columnOptions[payload.column] = getDefaultColumnOptions()
        }

        const existingIndex = state.columnOptions[payload.column].valueFilters.findIndex(
          vf => vf.value === payload.value
        )
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
        .flatMap(row => getColumnValue(row, column))
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

const injectParentPointers = columns => {
  columns.forEach(col => {
    if (col.children) {
      col.children.forEach(child => {
        child.parent = col
      })

      injectParentPointers(col.children)
    }
  })
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

const findFirstLeafColumn = pColumns => {
  let columns = pColumns

  while (columns[0]?.children) columns = columns[0].children

  return columns[0]
}

const insertParentColumn = (rootColumns, childColumn, props = {}) => {
  let collection

  if (childColumn.parent) {
    collection = childColumn.parent.children
  } else {
    collection = rootColumns
  }

  const index = collection.findIndex(e => e.key === childColumn.key)

  if (childColumn.parent && childColumn.parent.mergeHeader === childColumn.key) {
    childColumn.parent.mergeHeader = props.key
  }

  const newParent = {
    ...props,
    parent: childColumn.parent,
    children: [childColumn],
  }

  collection[index] = newParent
  childColumn.parent = newParent

  return newParent
}

const insertGroupColumns = (columns, groupDepth, toggleGroup, expandedGroups) => {
  if (groupDepth > 0) {
    const firstColumn = findFirstLeafColumn(columns)

    const newParent = insertParentColumn(columns, firstColumn, {
      key: '__group_parent',
      getRowContent: undefined,
      getRowVal: undefined,
      mergeHeader: firstColumn.key,
      merge: true,
      noHeader: false,
    })

    const groupColumns = _.range(0, groupDepth).map(i => ({
      key: `__group_${i}`,
      export: false,
      cellProps: (__, _isGroup, [group]) => ({
        'data-cy': `toggle-group-${group.key}`,
        onClick: () => toggleGroup(group.key),
        style: { cursor: 'pointer' },
      }),
      getRowContent: (__, isGroup, parents) =>
        isGroup &&
        parents.length === i + 1 && (
          <Icon
            name={`chevron ${_.includes(expandedGroups, parents[0].key) ? 'down' : 'right'}`}
            style={{ margin: 0 }}
          />
        ),
    }))

    newParent.children.splice(0, 0, ...groupColumns)
  }
}

const extractColumnKeys = columns => {
  return _.chain(columns)
    .flatMap(column => {
      const pairs = [{ key: column.key, column }]

      if (column.children) {
        _.toPairs(extractColumnKeys(column.children)).forEach(([key, column]) => pairs.push({ key, column }))
      }

      return pairs
    })
    .map(({ key, column }) => [key, column])
    .fromPairs()
    .value()
}

class GroupKeyVisitor extends DataVisitor {
  constructor() {
    super()
    this.groups = []
  }

  visitGroup(ctx) {
    this.groups.push(ctx.item.definition.key)
  }
}

const SortableTable = ({
  columns: pColumns,
  title,
  data,
  defaultSort,
  style,
  actions,
  noHeader,
  stretch,
  collapsing,
  contextMenuItems: pContextMenuItems,
  singleLine = true,
  figure = true,
}) => {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [state, dispatch] = useReducer(tableStateReducer(defaultSort), null, getInitialState(defaultSort))
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

  const handleUnfoldAllGroups = useCallback(() => {
    const { groups } = GroupKeyVisitor.visit(data)

    dispatch({
      type: 'SET_UNFOLDED_GROUPS',
      payload: { groups },
    })
  }, [data])

  const handleFoldAllGroups = useCallback(() => {
    dispatch({
      type: 'SET_UNFOLDED_GROUPS',
      payload: { groups: [] },
    })
  }, [data])

  const [columns, columnsByKey] = useMemo(() => {
    const columns = _.cloneDeep(pColumns)

    injectParentPointers(columns)
    insertGroupColumns(columns, groupDepth, toggleGroup, state.expandedGroups)

    const byKey = extractColumnKeys(columns)

    return [columns, byKey]
  }, [pColumns, groupDepth, toggleGroup, state.expandedGroups])

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

  const tableStyles = {
    position: 'relative',
  }

  if (stretch) {
    tableStyles.width = '100%'
  }

  const figureStyles = { ...style }

  if (collapsing) {
    figureStyles.width = 'fit-content'
  }

  if (figure) {
    Object.assign(tableStyles, {
      borderRadius: 0,
      borderLeft: 'none',
      borderTop: 'none',
      background: 'white',
    })
  }

  const classNames = ['ui', 'table', 'collapsing', 'striped', 'celled']

  if (singleLine) {
    classNames.push('single', 'line')
  }

  if (figure) {
    classNames.push('basic')
  }

  const content = (
    <table className={classNames.join(' ')} style={tableStyles}>
      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>{headers}</thead>
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

  if (!figure) {
    return <SortableTableContext.Provider value={context}>{content}</SortableTableContext.Provider>
  }

  const contextMenuItems = [
    {
      label: 'Export to CSV',
      onClick: () => setExportModalOpen(true),
    },
    {
      label: 'Reset filters',
      onClick: () => dispatch({ type: 'RESET_FILTERS' }),
    },
    ...(groupDepth > 0
      ? [
          {
            label: 'Unfold all groups',
            onClick: handleUnfoldAllGroups,
          },
          {
            label: 'Fold all groups',
            onClick: handleFoldAllGroups,
          },
        ]
      : []),
    ...(pContextMenuItems ?? []),
  ]

  return (
    <>
      <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} data={data} columns={columns} />
      <SortableTableContext.Provider value={context}>
        <FigureContainer style={figureStyles}>
          <FigureContainer.Header actions={actions} contextItems={contextMenuItems}>
            <Icon style={{ color: '#c2c2c2', position: 'relative', top: '1px', marginRight: '0.5em' }} name="table" />{' '}
            {title}
          </FigureContainer.Header>
          <FigureContainer.Content
            style={{ padding: 0, overflow: 'auto', backgroundColor: '#e8e8e91c', maxHeight: '80vh' }}
          >
            {content}
          </FigureContainer.Content>
        </FigureContainer>
      </SortableTableContext.Provider>
    </>
  )
}

export { group }

export default SortableTable
