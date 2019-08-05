import { createSelector } from 'reselect'
import { getActiveLanguage } from 'react-localize-redux'
import { getTextIn } from '../common'

const languageSelector = state => getActiveLanguage(state.localize).code
const associationsSelector = state => state.populationDegreesAndProgrammesUnfiltered.data

const toOptions = (elements, language) => (!elements ? [] : Object.values(elements).map(element => ({
  code: element.code,
  name: getTextIn(element.name, language)
})))

const userRightsPropSelector = (_, props) => props.rights

const dropdownProgrammeSelector = createSelector(
  languageSelector,
  associationsSelector,
  (language, assocs) => {
    const programmes = toOptions(assocs.programmes, language)
    return programmes
  }
)

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
  filteredDropdownProgrammeSelector
}
