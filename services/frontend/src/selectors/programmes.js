import { createSelector } from 'reselect'

const associationsSelector = state => state.populationProgrammesUnfiltered.data

const toOptions = elements =>
  !elements
    ? []
    : Object.values(elements).map(element => ({
        code: element.code,
        name: element.name,
      }))

const userRightsPropSelector = (_, props) => props.rights

const dropdownProgrammeSelector = createSelector(associationsSelector, assocs => {
  const programmes = toOptions(assocs.programmes)
  return programmes
})

const filteredDropdownProgrammeSelector = createSelector(
  dropdownProgrammeSelector,
  userRightsPropSelector,
  (programmes, rights) => {
    const rightsSet = new Set(rights)
    const notSelected = ({ code }) => !rightsSet.has(code)
    return programmes.filter(notSelected)
  }
)

export default {
  filteredDropdownProgrammeSelector,
}
