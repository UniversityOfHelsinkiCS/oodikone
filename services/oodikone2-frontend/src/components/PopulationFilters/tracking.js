import TSA from '../../common/tsa'

const rgx = /\/([^/]+)\.jsx$/
// 'src/components/PopulationFilters/CreditsAtLeast.jsx' -> 'CreditsAtLeast'
const filenameToComponentName = filename => rgx.exec(filename)[1]

const sendFilterEvent = (action, value) => {
  TSA.Matomo.sendEvent('Population Filters', action, value)
}

// these are manual-labor-reducing functions for the individual filter components
// takes in __filename from webpack and gets the filter name from that
const set = filename => sendFilterEvent('Set filter', filenameToComponentName(filename))
const altered = filename => sendFilterEvent('Altered filter', filenameToComponentName(filename))
const cleared = filename => sendFilterEvent('Cleared filter', filenameToComponentName(filename))

export default {
  set,
  altered,
  cleared,
  sendFilterEvent
}
