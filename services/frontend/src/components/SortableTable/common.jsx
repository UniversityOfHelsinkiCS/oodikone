/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */

const DataItemTypeKey = Symbol('DATA_ITEM_TYPE')

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

class DataVisitorContext {
  constructor(visitor, item, parents = [], isGroup = false) {
    this.visitor = visitor
    this.item = item
    this.parents = parents
    this.isGroup = isGroup
  }

  visitItem(item) {
    return this.visitor.visitItem(item, this)
  }

  withGroup(group) {
    return new DataVisitorContext(this.visitor, group, [group, ...this.parents], true)
  }

  withRow(row) {
    return new DataVisitorContext(this.visitor, row, this.parents, false)
  }
}

export class DataVisitor {
  visitRow() {}

  visitGroup(ctx) {
    ctx.item.children.forEach(item => ctx.visitItem(item))
  }

  visitItem(item, pCtx) {
    let ctx = pCtx

    if (ctx === undefined) {
      ctx = new DataVisitorContext(this, null)
    }

    const type = getDataItemType(item)

    if (type === DataItemType.Group) {
      return this.visitGroup(ctx.withGroup(item))
    }
    return this.visitRow(ctx.withRow(item))
  }

  static visit(items, ...args) {
    const visitor = new this(...args)
    items.forEach(item => visitor.visitItem(item))
    return visitor
  }
}
