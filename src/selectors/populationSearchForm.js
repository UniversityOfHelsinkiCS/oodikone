import { createSelector } from 'reselect'

const getUnits = units => units.data

export const mapRightsToDropdown = rights =>
  rights.map(r => ({ key: r.id, value: r.id, text: r.name }))

export const makeMapRightsToDropDown = () => createSelector(
  getUnits,
  mapRightsToDropdown
)
