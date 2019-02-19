import { createSelector } from 'reselect'

const getUnits = units => units.data

export const mapRightsToDropdown = rights =>
  Object.values(rights).map(r => Object.values(r).map(r2 =>
    ({ key: r2.id,
      value: r2.id,
      text: r2.name,
      type: r2.type,
      description: r2.id,
      associations: r2.associations })))

export const makeMapRightsToDropDown = () => createSelector(
  getUnits,
  mapRightsToDropdown
)
