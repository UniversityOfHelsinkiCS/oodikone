/* eslint-disable no-return-assign */

import React, { useRef, useState, useEffect, useMemo, useReducer, useCallback } from 'react'
import { useContext, useContextSelector } from 'use-context-selector'
import { Icon, Popup } from 'semantic-ui-react'
import FigureContainer from 'components/FigureContainer'
import _ from 'lodash'
import produce from 'immer'
import { v4 as uuidv4 } from 'uuid'
import ExportModal from './ExportModal'
import { row, group, getDataItemType, SortableTableContext, DataItemType } from './common'
import DefaultColumnFilter from './defaultFilter'
import DateColumnFilter from './dateFilter'
import RangeColumnFilter from './rangeFilter'
import SortingFilteringVisitor from './SortingFilteringVisitor'
import GroupKeyVisitor from './GroupKeyVisitor'
import ValueVisitor from './ValueVisitor'
import './style.css'

const getKey = data => {
  if (data.studentnumber) return data.studentnumber
  if (data.id) return data.id
  return uuidv4()
}

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
        <td colSpan={columnSpans[column.key]} key={column.key + cellProps.title} {...cellProps}>
          <ColumnContent column={column} data={data} isGroup={isGroup} parents={parents} />
        </td>
      )
    } else if (column.children && column.children.length > 0) {
      stack.splice(0, 0, ...column.children.map((c, i) => ({ ...c, childIndex: i })))
    } else {
      cells.push(<td key={`${column.key}-else-${cellProps.title}`} {...cellProps} />)
    }
  }

  return (
    <tr className={isGroup ? 'group-header-row' : ''} key={getKey(data)}>
      {cells}
    </tr>
  )
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

const ColumnFilters = {
  default: DefaultColumnFilter,
  date: DateColumnFilter,
  range: RangeColumnFilter,
}

const SizeMeasurer = ({ as = 'div', onSizeChange, children, ...rest }) => {
  const monitorRef = useRef(
    new window.ResizeObserver(entries => {
      if (Array.isArray(entries[0].borderBoxSize)) {
        onSizeChange(entries[0].borderBoxSize[0])
      } else {
        onSizeChange(entries[0].borderBoxSize)
      }
    })
  )

  const targetRef = useRef()

  const target = useCallback(node => {
    if (node) {
      monitorRef.current.observe(node)
    } else {
      monitorRef.current.unobserve(targetRef.current)
    }

    targetRef.current = node
  }, [])

  /* useLayoutEffect(() => {
    const rect = targetRef.current.getBoundingClientRect();

    onSizeChange({
      inlineSize: rect.width,
      blockSize: rect.height,
    });
  }, [onSizeChange]); */

  const Container = as

  return (
    <Container {...rest} ref={target} style={{ ...rest.style }}>
      {children}
    </Container>
  )
}

const Orientable = ({ orientation, children, ...rest }) => {
  const sizeRef = useRef()
  const containerRef = useRef()

  useEffect(() => {
    if (sizeRef.current && containerRef.current) {
      const size = sizeRef.current
      const [width, height] =
        orientation === 'vertical' ? [size.blockSize, size.inlineSize] : [size.inlineSize, size.blockSize]

      containerRef.current.style.width = `${width}px`
      containerRef.current.style.height = `${height}px`
    }
  }, [orientation, containerRef, sizeRef])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <SizeMeasurer
        {...rest}
        onSizeChange={size => {
          sizeRef.current = size
          const [width, height] =
            orientation === 'vertical' ? [size.blockSize, size.inlineSize] : [size.inlineSize, size.blockSize]

          if (containerRef.current) {
            containerRef.current.style.width = `${width}px`
            containerRef.current.style.height = `${height}px`
          }
        }}
        style={{
          position: 'absolute',
          left: orientation === 'vertical' ? '100%' : '0',
          transformOrigin: '0% 0%',
          transform: orientation === 'vertical' ? 'rotate(90deg)' : 'initial',
          ...rest?.style,
        }}
      >
        {children}
      </SizeMeasurer>
    </div>
  )
}

const getDefaultColumnOptions = () => ({
  valueFilters: [],
})

const ColumnHeader = ({ columnKey, displayColumnKey, ...props }) => {
  const storedState = useContextSelector(SortableTableContext, ctx => ctx.state.columnOptions[displayColumnKey])
  const colSpan = useContextSelector(SortableTableContext, ctx => ctx.columnSpans[columnKey])

  const state = useMemo(() => storedState ?? getDefaultColumnOptions(), [storedState])

  return <ColumnHeaderContent state={state} colSpan={colSpan} {...props} />
}

const ColumnHeaderContent = React.memo(({ column, colSpan, state, dispatch, rowSpan, style }) => {
  const cellSize = useRef()
  const titleSize = useRef()
  const toolsSize = useRef()
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [dynamicToolsMode, setToolsMode] = useState('fixed')
  const [forcedTitleWidth, setForcedTitleWidth] = useState()

  let toolsMode = dynamicToolsMode

  if (column.forceToolsMode) {
    toolsMode = column.forceToolsMode
  }

  const noDangling = column.noDangling || column.helpText

  useEffect(() => {
    if (!noDangling && forcedTitleWidth) {
      setForcedTitleWidth(undefined)
    }
  }, [column.noDangling, column.helpText])

  const { sort } = state

  const filterColumnKey = column.mergeHeader ? column.children[0].key : column.key

  const sortIcon = { desc: 'sort down', asc: 'sort up' }[sort] ?? 'sort'

  const sortable = column.sortable !== false
  const filterable = column.filterable !== false
  const hasChildren = column.children && column.children.length > 0

  const { component: FilterComponent, isActive } = ColumnFilters[column.filterType ?? 'default']

  const filterComponentDispatch = evt => {
    dispatch({
      type: 'COLUMN_FILTER_EVENT',
      payload: {
        column: column.key,
        filterType: column.filterType ?? 'default',
        event: evt,
      },
    })
  }

  const isFilterActive =
    isActive && isActive(state.filterOptions ?? ColumnFilters[column.filterType ?? 'default'].initialOptions())
  const isSortingActive = !!sort

  const evaluateSizes = () => {
    const cellWidth = cellSize?.current?.inlineSize
    const titleWidth = titleSize?.current?.inlineSize
    const toolsWidth = toolsSize?.current?.inlineSize

    if (cellWidth === undefined || titleWidth === undefined || toolsWidth === undefined) {
      return
    }

    if (toolsWidth > cellWidth) {
      if (!noDangling) {
        setToolsMode('dangling')
      } else {
        setForcedTitleWidth(toolsWidth - (cellWidth - titleWidth))
      }
    } else if (titleWidth + toolsWidth > cellWidth) {
      setToolsMode('floating')
    } else {
      setToolsMode('fixed')
    }
  }

  const onCellSizeChange = size => {
    cellSize.current = size
    evaluateSizes()
  }

  const onTitleSizeChange = size => {
    titleSize.current = size
    evaluateSizes()
  }

  const onToolsSizeChange = size => {
    toolsSize.current = size
    evaluateSizes()
  }

  const helpIcon = (
    <Icon
      name="question circle outline"
      style={{ opacity: 0.5, display: 'inline-block', marginRight: 0, flexShrink: 0 }}
    />
  )

  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={filterMenuOpen ? 'filter-menu-open' : 'filter-menu-closed'}
      style={{
        ...style,
        cursor: sortable ? 'pointer' : 'initial',
        verticalAlign: column.vertical ? 'top' : 'center',
        position: 'relative',
        overflow: toolsMode === 'floating' ? 'hidden' : '',
        display: toolsMode === 'none' ? 'none' : '',
      }}
      onClick={() => {
        if (sortable) {
          dispatch({
            type: 'TOGGLE_COLUMN_SORT',
            payload: { column: filterColumnKey },
          })
        }
      }}
    >
      <SizeMeasurer onSizeChange={onCellSizeChange} style={{ display: 'flex', alignItems: 'center' }}>
        {toolsMode !== 'fixed' && (isFilterActive || isSortingActive) && (
          <div
            style={{
              borderWidth: '7px',
              borderStyle: 'solid',
              borderColor: 'transparent transparent rgb(33, 133, 208)',
              position: 'absolute',
              bottom: 0,
              right: '-7px',
            }}
          />
        )}
        <Orientable
          orientation={column.vertical ? 'vertical' : 'horizontal'}
          style={{
            flexGrow: 1,
            minWidth: forcedTitleWidth,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <SizeMeasurer onSizeChange={onTitleSizeChange} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {column.title}
            {column.helpText && !forcedTitleWidth && (
              <Icon
                name="question circle outline"
                style={{ opacity: 0.5, display: 'inline-block', marginRight: 0, marginLeft: '0.5em', flexShrink: 0 }}
              />
            )}
          </SizeMeasurer>
          {column.helpText && forcedTitleWidth && (
            <>
              <div style={{ flexGrow: 1 }} />
              <Icon
                name="question circle outline"
                style={{ opacity: 0.5, display: 'inline-block', marginRight: 0, marginLeft: '0.5em', flexShrink: 0 }}
              />
            </>
          )}
        </Orientable>
        <div style={{ flexGrow: 1 }} />
        <SizeMeasurer onSizeChange={onToolsSizeChange} className={`column-tools ${toolsMode}`}>
          <div>
            {sortable && (!hasChildren || column.mergeHeader) && (
              <Icon
                name={sortIcon}
                style={{ color: sort ? 'rgb(33, 133, 208)' : '#bbb', position: 'relative', top: '-1px' }}
              />
            )}
            {filterable && (!hasChildren || column.mergeHeader) && (
              <Popup
                offset={[-3, 0]}
                trigger={<Icon name="filter" style={{ color: isFilterActive ? 'rgb(33, 133, 208)' : '#bbb' }} />}
                position="bottom center"
                open={filterMenuOpen}
                onOpen={e => {
                  if (e?.stopPropagation) {
                    e.stopPropagation()
                  }

                  setFilterMenuOpen(true)
                }}
                onClose={e => {
                  if (e?.stopPropagation) {
                    e.stopPropagation()
                  }

                  setFilterMenuOpen(false)
                }}
                on="click"
                className="filter-menu"
                hideOnScroll={false}
                style={{ padding: 0, zIndex: 9005 }}
                hoverable
              >
                <div onClick={e => e.stopPropagation()}>
                  <FilterComponent
                    dispatch={filterComponentDispatch}
                    column={column}
                    options={state.filterOptions ?? ColumnFilters[column.filterType ?? 'default'].initialOptions()}
                  />
                  <div className="actions">
                    <div
                      className="item"
                      active={sort === 'asc'}
                      onClick={() =>
                        dispatch({ type: 'TOGGLE_COLUMN_SORT', payload: { column: filterColumnKey, direction: 'asc' } })
                      }
                    >
                      Sort: Ascending
                    </div>
                    <div
                      className="item"
                      active={sort === 'desc'}
                      onClick={() =>
                        dispatch({
                          type: 'TOGGLE_COLUMN_SORT',
                          payload: { column: filterColumnKey, direction: 'desc' },
                        })
                      }
                    >
                      Sort: Descending
                    </div>
                    <div
                      className="item"
                      onClick={() => dispatch({ type: 'RESET_COLUMN_FILTER', payload: { column: filterColumnKey } })}
                    >
                      Reset column filter
                    </div>
                  </div>
                </div>
              </Popup>
            )}
            {column.helpText && <Popup position="top center" trigger={helpIcon} content={column.helpText} />}
          </div>
        </SizeMeasurer>
      </SizeMeasurer>
    </th>
  )
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

const createHeaders = (columns, columnDepth, dispatch) => {
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
          key={column.key}
          columnKey={column.key}
          displayColumnKey={displayColumn.key}
          rowSpan={rowspan}
          style={style}
          column={displayColumn}
          dispatch={dispatch}
        />
      )
    }

    if (column.children && !column.mergeHeader) {
      const childDepth = column.noHeader ? currentDepth : currentDepth + 1
      const children = column.children.map(c => ({ ...c, depth: childDepth }))
      stack = [...children, ...stack]
    }
  }
  // eslint-disable-next-line react/no-array-index-key
  return rows.map((cells, idx) => <tr key={idx}>{cells}</tr>)
}

const getInitialState = (defaultSort, expandedGroups) => () => ({
  columnOptions: !defaultSort
    ? {}
    : {
        [defaultSort[0]]: { filterOptions: undefined, sort: defaultSort[1] },
      },
  expandedGroups: !expandedGroups ? [] : Array.from(expandedGroups), // [],
})

const tableStateReducer = (...args) =>
  produce((state, { type, payload }) => {
    ;({
      RESET_FILTERS: () => {
        state.columnOptions = getInitialState(...args)().columnOptions
      },
      RESET_COLUMN_FILTER: () => {
        if (state.columnOptions[payload.column]) {
          state.columnOptions[payload.column].filterOptions = undefined
        }
      },
      COLUMN_FILTER_EVENT: () => {
        const { initialOptions, reduce } = ColumnFilters[payload.filterType]

        if (state.columnOptions[payload.column] === undefined) {
          state.columnOptions[payload.column] = {}
        }

        if (state.columnOptions[payload.column].filterOptions === undefined) {
          state.columnOptions[payload.column].filterOptions = initialOptions()
        }

        const { filterOptions } = state.columnOptions[payload.column]

        reduce(filterOptions, payload.event)
      },
      SET_UNFOLDED_GROUPS: () => {
        state.expandedGroups = payload.groups
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
  toggleGroupExpansion,
  expandedGroups,
}) => {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [state, dispatch] = useReducer(
    tableStateReducer(defaultSort),
    null,
    getInitialState(defaultSort, expandedGroups)
  )
  const groupDepth = useMemo(() => calculateGroupDepth(data), [data])

  const toggleGroup = useCallback(
    groupKey => {
      dispatch({
        type: 'TOGGLE_GROUP',
        payload: { group: groupKey },
      })
      if (toggleGroupExpansion) {
        toggleGroupExpansion(groupKey)
      }
    },
    [dispatch]
  )

  const handleUnfoldAllGroups = useCallback(() => {
    const { groups } = GroupKeyVisitor.visit(data)

    dispatch({
      type: 'SET_UNFOLDED_GROUPS',
      payload: { groups },
    })
    if (toggleGroupExpansion) {
      toggleGroupExpansion('', false, groups)
    }
  }, [data])

  const handleFoldAllGroups = useCallback(() => {
    dispatch({
      type: 'SET_UNFOLDED_GROUPS',
      payload: { groups: [] },
    })
    if (toggleGroupExpansion) {
      toggleGroupExpansion('', true)
    }
  }, [data])

  const [columns, columnsByKey] = useMemo(() => {
    const columns = _.cloneDeep(pColumns)

    injectParentPointers(columns)
    insertGroupColumns(columns, groupDepth, toggleGroup, state.expandedGroups)

    const byKey = extractColumnKeys(columns)

    return [columns, byKey]
  }, [pColumns, groupDepth, toggleGroup, state.expandedGroups])

  const [columnSpans, columnDepth] = useMemo(() => computeColumnSpans(columns), [columns])

  const values = useMemo(
    () =>
      _.mapValues(ValueVisitor.visit(data, Object.values(columnsByKey), { honourIgnoreFilters: true }).values, set => [
        ...set,
      ]),
    [data, columnsByKey]
  )

  const headers = useMemo(() => createHeaders(columns, columnDepth, dispatch), [columns, columnDepth])

  const sortedData = useMemo(
    () => SortingFilteringVisitor.mutate(data, columnsByKey, state, ColumnFilters),
    [data, columnsByKey, state]
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

  const classNames = ['ui', 'table', 'collapsing', 'striped', 'celled', 'ok-sortable-table']

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
          <DataItem key={`dataItem-${getKey(item)}`} item={item} />
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

export { group, row }

export default SortableTable
