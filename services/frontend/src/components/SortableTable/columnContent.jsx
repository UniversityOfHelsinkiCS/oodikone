import { assign, clone, includes, isEqual, merge } from 'lodash'
import { memo } from 'react'
import { useContext, useContextSelector } from 'use-context-selector'

import { cloneColumns, DataItemType, getDataItemType, SortableTableContext, thickBorderStyles } from './common'
import './style.css'

export const getKey = data => {
  const columnsToCheck = ['studentNumber', 'studentnumber', 'id']
  for (const column of columnsToCheck) {
    if (data[column]) return data[column]
  }
  return crypto.randomUUID()
}

const mergeColumnDefinitions = (original, overlay) => {
  const result = cloneColumns(original)

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
      assign(orig, merge(orig, overlayDef))
    }
  })

  return result
}

export const DataItem = ({ item, parents = [] }) => {
  const context = useContext(SortableTableContext)

  const type = getDataItemType(item)

  if (type === DataItemType.Row) {
    return <Row data={item} parents={parents} />
  }

  const overriddenContext = {
    ...context,
    columns: mergeColumnDefinitions(context.columns, item.definition.columnOverrides),
  }

  const { headerRowData } = item.definition

  const headerRow = (
    <SortableTableContext.Provider value={overriddenContext}>
      <Row data={headerRowData} isGroup parents={[item.definition, ...parents]} />
    </SortableTableContext.Provider>
  )

  const childRows = includes(context.state.expandedGroups, item.definition.key)
    ? item.children.map(child => <DataItem item={child} key={getKey(item)} parents={[item.definition, ...parents]} />)
    : undefined

  return (
    <>
      {headerRow}
      {childRows}
    </>
  )
}

export const resolveDisplayColumn = column => {
  let displayColumn = null

  if (column.mergeHeader) {
    if (column.mergeHeader === true) {
      ;[displayColumn] = column.children
    } else if (typeof column.mergeHeader === 'string') {
      displayColumn = column.children.find(child => child.key === column.mergeHeader)
    }
  }

  if (displayColumn === null) {
    return column
  }

  return resolveDisplayColumn(displayColumn)
}

export const computeColumnSpans = columns => {
  const stack = cloneColumns(columns)
  const spans = {}

  let i = 0
  let maxDepth = 0

  while (stack.length > 0) {
    const element = stack[stack.length - 1]

    const currentDepth = element.depth ?? 1

    maxDepth = Math.max(currentDepth, maxDepth)

    if (element.start !== undefined) {
      spans[element.key] = i - element.start
      stack.pop()
    } else if (!element.children || element.children.length === 0) {
      i += 1
      spans[element.key] = 1
      stack.pop()
    } else {
      element.start = i
      let depth = currentDepth + 1

      if (element.mergeHeader) {
        depth = currentDepth
      }

      element.children.forEach(element => stack.push({ ...element, depth }))
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
  } catch (error) {
    return 'Error'
  }
}

const RowComponent = ({ data, isGroup, parents }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const columns = useContextSelector(SortableTableContext, ({ columns }) => columns)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const columnSpans = useContextSelector(SortableTableContext, ({ columnSpans }) => columnSpans)

  const resolveProp = value => {
    if (typeof value === 'function') {
      return value(data, isGroup, parents)
    }
    return value
  }

  const cells = []

  const stack = clone(columns)

  while (stack.length > 0) {
    const [column] = stack.splice(0, 1)

    let cellProps = resolveProp(column.cellProps) ?? {}

    if (column.parent?.merge && column.childIndex > 0) {
      cellProps = merge(cellProps, {
        style: { borderLeft: 'none', paddingLeft: 0 },
      })
    }

    if (column.childIndex === 0 && column.parent?.thickBorders) {
      cellProps.style = { ...cellProps.style, ...thickBorderStyles }
    }

    if (column.cellStyle) {
      cellProps = merge(cellProps, {
        style: column.cellStyle,
      })
    }

    if (column.displayColumn === false) {
      cellProps.style = { ...cellProps.style, display: 'none' }
    }

    const content = getCellContent(column, data, isGroup, parents)

    if (!Number.isNaN(Number(content))) {
      cellProps.style = { textAlign: 'right', ...cellProps.style }
    }

    if (content != null) {
      cells.push(
        <td colSpan={columnSpans[column.key]} key={column.key + cellProps.title} {...cellProps}>
          <ColumnContent column={column} data={data} isGroup={isGroup} parents={parents} />
        </td>
      )
    } else if (column.children && column.children.length > 0) {
      stack.splice(0, 0, ...column.children.map((child, index) => ({ ...child, childIndex: index })))
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

const Row = memo(
  RowComponent,
  (prevProps, nextProps) =>
    isEqual(prevProps.data, nextProps.data) &&
    isEqual(prevProps.isGroup, nextProps.isGroup) &&
    isEqual(prevProps.parents, nextProps.parents)
)
