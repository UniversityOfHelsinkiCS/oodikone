/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */

import { getDataItemType, DataItemType } from '../common'

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

  withItem(item) {
    if (getDataItemType(item) === DataItemType.Group) {
      return this.withGroup(item)
    }
    return this.withRow(item)
  }

  withGroup(group) {
    return new DataVisitorContext(this.visitor, group, [group, ...this.parents], true)
  }

  withRow(row) {
    return new DataVisitorContext(this.visitor, row, this.parents, false)
  }
}

export default class DataVisitor {
  visitRow(ctx) {
    return ctx.item
  }

  visitGroup(ctx) {
    return {
      ...ctx.item,
      children: this.visitItems(ctx.item.children, ctx),
    }
  }

  visitItems(items, pCtx) {
    let ctx = pCtx

    if (ctx === undefined) {
      ctx = new DataVisitorContext(this, null)
    }

    return items.map(item => ctx.visitItem(item))
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
    visitor.visitItems(items, new DataVisitorContext(visitor, null))
    return visitor
  }

  static mutate(items, ...args) {
    const visitor = new this(...args)
    return visitor.visitItems(items, new DataVisitorContext(visitor, null))
  }
}
