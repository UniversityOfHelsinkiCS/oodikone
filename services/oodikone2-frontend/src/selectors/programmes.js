import { createSelector } from 'reselect'
import { getActiveLanguage } from 'react-localize-redux'
import { getTextIn } from '../common'

const languageSelector = state => getActiveLanguage(state.localize).code
const associationsSelector = state => state.populationDegreesAndProgrammesUnfiltered.data

const toOptions = (elements, language) => (!elements ? [] : Object.values(elements).map(element => ({
  code: element.code,
  name: getTextIn(element.name, language)
})))

const formatOptions = (elements, language) => (!elements ? [] : Object.values(elements).map(elem => ({
  code: elem.code,
  name: getTextIn(elem.name, language),
  progs: Object.keys(elem.programmes)
})))

const dropdownOptionsSelector = createSelector(
  languageSelector,
  associationsSelector,
  (language, associations) => {
    const { degrees, programmes, studyTracks } = associations
    return {
      degrees: toOptions(degrees, language),
      programmes: toOptions(programmes, language),
      tracks: toOptions(studyTracks, language)
    }
  }
)

const groupByProgramme = (elements) => {
  const acc = {}
  elements.forEach(({ code, name, progs }) => {
    progs.forEach((progcode) => {
      const programme = acc[progcode] || (acc[progcode] = [])
      programme.push({ code, name })
    })
  })
  return acc
}

const userRightsPropSelector = (_, props) => props.rights.map(r => r.code)

const dropdownAssociationsSelector = createSelector(
  languageSelector,
  associationsSelector,
  (language, assocs) => {
    const degrees = formatOptions(assocs.degrees, language)
    const tracks = formatOptions(assocs.studyTracks, language)
    const programmeDegrees = groupByProgramme(degrees)
    const programmeTracks = groupByProgramme(tracks)
    const programmes = toOptions(assocs.programmes, language).map(({ code, name }) => ({
      code,
      name,
      degrees: programmeDegrees[code] || [],
      tracks: programmeTracks[code] || []
    }))
    return programmes
  }
)

const filteredDropdownAssociationsSelector = createSelector(
  dropdownAssociationsSelector,
  userRightsPropSelector,
  (associations, rights) => {
    const rightsSet = new Set(rights)
    const notSelected = ({ code, tracks, degrees }) => !(rightsSet.has(code) && tracks.length === 0 && degrees.length === 0)
    const programmes = associations.map(({ degrees, tracks, ...rest }) => ({
      degrees: degrees.filter(d => !rightsSet.has(d.code)),
      tracks: tracks.filter(t => !rightsSet.has(t.code)),
      ...rest
    }))
    const filtered = programmes.filter(notSelected)
    return filtered
  }
)

export default {
  dropdownOptionsSelector,
  associationsSelector,
  dropdownAssociationsSelector,
  filteredDropdownAssociationsSelector
}
