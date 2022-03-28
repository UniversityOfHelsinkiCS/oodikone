/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */

import { createContext } from 'use-context-selector'

const DataItemTypeKey = Symbol('DATA_ITEM_TYPE')

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

export const getColumnValue = (ctx, column) => {
  if (column.getRowVal) {
    return column.getRowVal(ctx.item, ctx.isGroup, ctx.parents)
  }

  return null
}
