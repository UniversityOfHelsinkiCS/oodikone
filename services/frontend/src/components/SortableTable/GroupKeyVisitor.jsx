import DataVisitor from './DataVisitor'

export default class GroupKeyVisitor extends DataVisitor {
  constructor() {
    super()
    this.groups = []
  }

  visitGroup(ctx) {
    this.groups.push(ctx.item.definition.key)
  }
}
