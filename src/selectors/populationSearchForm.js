import { createSelector } from 'reselect'
import { groupBy } from 'lodash'

const getUnits = units => units.data

export const mapRightsToDropdown = rights =>
  groupBy(rights.map(r => ({ key: r.id, value: r.id, text: r.name, type: r.type, description: r.id, associations: r.associations || r.associatons })), 'type') // || can be removed when typo fixed :d


export const makeMapRightsToDropDown = () => createSelector(
  getUnits,
  mapRightsToDropdown
)
