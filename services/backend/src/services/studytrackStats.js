// const { getAssociations } = require('./studyrights')
// const { getYearsArray } = require('./studyprogrammeHelpers')

const getStudytrackStatsForStudyprogramme = async studyprogramme => {
  //  const years = getYearsArray(since)
  //  const associations = await getAssociations()
  //  const programmeYears = associations.programmes[studyprogramme]
  //  const stats = years.map(async year => (programmeYears[year] ? Object.keys(programmeYears[year].studytracks) : []))
  return { id: studyprogramme }
}

module.exports = {
  getStudytrackStatsForStudyprogramme,
}
