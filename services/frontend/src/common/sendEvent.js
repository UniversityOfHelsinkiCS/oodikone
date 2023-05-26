// Enumerate analytics categories to avoid having (to copy-paste) hard-coded names in code.
import TSA from './tsa'

const { sendEvent } = TSA.Matomo

export const ANALYTICS_CATEGORIES = {
  populationStudents: 'Population students',
  populationStatistics: 'Population statistics',
  studentStatistics: 'Student statistics',
  degreeCourses: 'Degree courses',
  common: 'Common',
}

// This export could be created with Object.fromEntries, but then autocomplete wont work.
export default {
  populationStudents: (action, name, value) => {
    sendEvent(ANALYTICS_CATEGORIES.populationStudents, action, name, value)
  },
  populationStatistics: (action, name, value) => {
    sendEvent(ANALYTICS_CATEGORIES.populationStatistics, action, name, value)
  },
  degreeCourses: (action, name, value) => {
    sendEvent(ANALYTICS_CATEGORIES.degreeCourses, action, name, value)
  },
  common: (action, name, value) => {
    sendEvent(ANALYTICS_CATEGORIES.common, action, name, value)
  },
}
