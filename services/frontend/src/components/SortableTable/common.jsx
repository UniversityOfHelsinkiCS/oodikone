/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */

import { createContext } from 'use-context-selector'

const DataItemTypeKey = Symbol('DATA_ITEM_TYPE')
const RowOptionsKey = Symbol('ROW_OPTIONS')

export const SortableTableContext = createContext(null)

export const DataItemType = {
  Group: 'group',
  Row: 'row',
}

export const getDataItemType = item => {
  if (item[DataItemTypeKey] === DataItemType.Group) {
    return DataItemType.Group
  }

  return DataItemType.Row
}

export const group = (definition, children) => {
  return {
    definition,
    children,
    [DataItemTypeKey]: DataItemType.Group,
  }
}

export const row = (data, options = {}) => {
  return {
    ...data,
    [RowOptionsKey]: options,
  }
}

export const getRowOptions = data => {
  return data[RowOptionsKey] ?? {}
}

export const getColumnValue = (ctx, column, exportMode = false) => {
  if (exportMode && column.getRowExportVal) {
    return column.getRowExportVal(ctx.item, ctx.isGroup, ctx.parents)
  }

  if (column && column.getRowVal) {
    return column.getRowVal(ctx.item, ctx.isGroup, ctx.parents)
  }

  return null
}

export const getColumnTitle = column => {
  return [...(column.parents ?? []), column]
    .filter(c => c.textTitle !== null || (c.textTitle ?? c.title))
    .map(c => c.textTitle ?? c.title)
    .filter(c => typeof c === 'string')
    .join(' - ')
}
