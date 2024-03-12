import _ from 'lodash'
import React from 'react'
import { useContext } from 'use-context-selector'

import { cloneColumns, DataItemType, getDataItemType, SortableTableContext, thickBorderStyles } from './common'
import './style.css'

export const getKey = data => {
  if (data.studentnumber) return data.studentnumber
  if (data.id) return data.id
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
      _.assign(orig, _.merge(orig, overlayDef))
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
      displayColumn = column.children.find(c => c.key === column.mergeHeader)
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

    if (column.childIndex === 0 && column.parent?.thickBorders) {
      cellProps.style = { ...cellProps.style, ...thickBorderStyles }
    }

    if (column.cellStyle) {
      cellProps = _.merge(cellProps, {
        style: column.cellStyle,
      })
    }

    if (column.displayColumn === false) {
      cellProps.style = { ...cellProps.style, display: 'none' }
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
