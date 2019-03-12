const { Op } = require('sequelize')
const { Credit, Course, Provider, Studyright, StudyrightElement, ElementDetails } = require('../models')

const isNumber = str => !Number.isNaN(Number(str))

const studytrackToProviderCode = code => {
  const [left, right] = code.split('_')
  const prefix = [...left].filter(isNumber).join('')
  const suffix = `${left[0]}${right}`
  return `${prefix}0-${suffix}`
}

const isThesis = (name, credits) => {
  const nameMatch = !!name.toLowerCase().match(/^.*(bachelor|master).*thesis.*$/)
  return nameMatch && (credits >= 20)
}

const formatCredit = credit => {
  const { id, credits, attainment_date, course : { name } } = credit
  const year = attainment_date && attainment_date.getFullYear()
  const course = name.en
  const thesis = isThesis(course, credits)
  return { id, year, credits, course, thesis }
}

const getCreditsForProvider = (provider) => Credit.findAll({
  attributes: ['id', 'course_code', 'credits', 'attainment_date'],
  include: {
    model: Course,
    attributes: ['code', 'name'],
    required: true,
    where: {
      is_study_module: false
    }, 
    include: {
      model: Provider,
      attributes: [],
      required: true,
      where: {
        providercode: provider
      }
    }
  },
  where: {
    credittypecode: {
      [Op.ne]: 10
    }
  }
}).map(formatCredit)

const productivityStatsFromCredits = credits => {
  const stats = {}
  credits.forEach(({ year, credits: creds, thesis }) => {
    const stat = stats[year] || (stats[year] = { credits: 0, thesis: 0, year })
    stat.credits += creds
    thesis && stat.thesis++
  })
  return stats
}

const productivityStatsForProvider = async providercode => {
  const credits = await getCreditsForProvider(providercode)
  return productivityStatsFromCredits(credits)
}

const formatGraduatedStudyright = ({ studyrightid, enddate }) => {
  const year = enddate && enddate.getFullYear()
  return { studyrightid, year }
}

const findGraduated = studytrack => Studyright.findAll({
  include: {
    model: StudyrightElement,
    attributes: [],
    required: true,
    include: {
      model: ElementDetails,
      attributes: [],
      required: true,
      where: {
        code: studytrack
      }
    }
  },
  where: {
    graduated: 1
  }
}).map(formatGraduatedStudyright)

const graduatedStatsFromStudyrights = studyrights => {
  const stats = {}
  studyrights.forEach(({ year }) => {
    const graduated = stats[year] || 0
    stats[year] = graduated + 1
  })
  return stats
}

const graduatedStatsForStudytrack = async studytrack => {
  const studyrights = await findGraduated(studytrack)
  return graduatedStatsFromStudyrights(studyrights)
}

const combineStatistics = (creditStats, studyrightStats) => {
  const stats = { ...creditStats }
  Object.keys(stats).forEach(year => {
    stats[year].graduated = studyrightStats[year] || 0
  })
  return Object.values(stats)
}

const productivityStatsForStudytrack = async studytrack => {
  const providercode = studytrackToProviderCode(studytrack)
  const promises = [
    graduatedStatsForStudytrack(studytrack),
    productivityStatsForProvider(providercode)
  ]
  const [studyrightStats, creditStats] = await Promise.all(promises)
  return combineStatistics(creditStats, studyrightStats)
}

module.exports = {
  isThesis,
  studytrackToProviderCode,
  getCreditsForProvider,
  productivityStatsFromCredits,
  productivityStatsForProvider,
  findGraduated,
  graduatedStatsFromStudyrights,
  combineStatistics,
  productivityStatsForStudytrack
}