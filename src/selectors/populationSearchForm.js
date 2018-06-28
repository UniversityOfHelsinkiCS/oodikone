import { createSelector } from 'reselect'
import { groupBy } from 'lodash'

const getUnits = units => units.data

export const mapRightsToDropdown = rights =>
  groupBy(rights.map(r => ({ key: r.id, value: r.id, text: r.name, type: r.type })), 'type')


export const makeMapRightsToDropDown = () => createSelector(
  getUnits,
  mapRightsToDropdown
)
