/* eslint-disable no-return-assign */
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useContextSelector } from 'use-context-selector'
import { produce } from 'immer'
import { Icon, Popup } from 'semantic-ui-react'
import _ from 'lodash'

import './style.css'
import { SortableTableContext, getDataItemType, DataItemType, thickBorderStyles } from './common'
import { defaultColumnFilter } from './filters/defaultFilter'
import { dateColumnFilter } from './filters/dateFilter'
import { rangeColumnFilter } from './filters/rangeFilter'
import { resolveDisplayColumn } from './columnContent'

const getDefaultColumnOptions = () => ({
  valueFilters: [],
})

export const ColumnFilters = {
  default: defaultColumnFilter,
  date: dateColumnFilter,
  range: rangeColumnFilter,
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

export const createHeaders = (columns, columnDepth, dispatch) => {
  let stack = _.clone(columns)

  const rows = _.range(0, columnDepth).map(() => [])
  let i = 0
  columns.forEach(col => {
    if (!col.children) return
    col.children = col.children.map((child, index) => {
      return { ...child, childIndex: index }
    })
  })
  while (stack.length > 0) {
    i += 1

    const [column] = stack.splice(0, 1)

    if (column.parent?.mergeHeader) {
      continue // eslint-disable-line
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

export const getInitialState = (defaultSort, expandedGroups) => () => ({
  columnOptions: !defaultSort
    ? {}
    : {
        [defaultSort[0]]: { filterOptions: undefined, sort: defaultSort[1] },
      },
  expandedGroups: !expandedGroups ? [] : Array.from(expandedGroups), // [],
})

export const tableStateReducer = (...args) =>
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
      // eslint-disable-next-line prettier/prettier
    })[type]()
  })

export const injectParentPointers = columns => {
  columns.forEach(col => {
    if (col.children) {
      col.children.forEach(child => {
        child.parent = col
      })

      injectParentPointers(col.children)
    }
  })
}

export const calculateGroupDepth = data => {
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

export const insertGroupColumns = (columns, groupDepth, toggleGroup, expandedGroups) => {
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

export const extractColumnKeys = columns => {
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

  const borderStyles =
    column.thickBorders || (column.parent?.thickBorders && column.childIndex === 0) ? thickBorderStyles : {}

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
      id={column.key}
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={filterMenuOpen ? 'filter-menu-open' : 'filter-menu-closed'}
      style={{
        ...style,
        cursor: sortable ? 'pointer' : 'initial',
        verticalAlign: column.vertical ? 'top' : 'center',
        position: 'relative',
        overflow: toolsMode === 'floating' ? 'hidden' : '',
        display: column.displayColumn === false ? 'none' : '',
        ...borderStyles,
      }}
      onClick={() => {
        if (sortable) {
          dispatch({
            type: 'TOGGLE_COLUMN_SORT',
            payload: { column: filterColumnKey },
          })
        }
      }}
      {...column.headerProps}
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
            {typeof column.title === 'string' ? <p style={{ whiteSpace: 'pre' }}>{column.title}</p> : column.title}
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
                      onClick={() =>
                        dispatch({ type: 'TOGGLE_COLUMN_SORT', payload: { column: filterColumnKey, direction: 'asc' } })
                      }
                    >
                      Sort: Ascending
                    </div>
                    <div
                      className="item"
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
