// Enumerate analytics categories to avoid having (to copy-paste) hard-coded names in code.
import TSA from './tsa'

const { sendEvent } = TSA.Matomo

export const ANALYTICS_CATEGORIES = {
  populationStudents: 'Population students'
}

export default Object.fromEntries(
  Object.entries(ANALYTICS_CATEGORIES).map(([catKey, catName]) => [
    catKey,
    (action, name, value) => sendEvent(catName, action, name, value)
  ])
)
