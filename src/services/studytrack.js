const { Op } = require('sequelize')
const moment = require('moment')
const { Credit, Course, Provider, Studyright, StudyrightElement, ElementDetails } = require('../models')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { semesterStart, semesterEnd } = require('../util/semester')
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
  const { id, credits, attainment_date, course: { name } } = credit
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

const creditsAfter = (studentnumbers, startDate) => {
  const failed = ['0', 'Hyl.', 'Luop', 'Eisa']
  return Promise.all(studentnumbers
    .map(student => Credit.sum('credits', {
      where: {
        student_studentnumber: {
          [Op.eq]: student
        },
        attainment_date: {
          [Op.gte]: startDate
        },
        isStudyModule: {
          [Op.eq]: false
        },
        grade: {
          [Op.notIn]: failed
        }
      }
  })))
}

const graduationsFromClass = (studentnumbers, startDate, endDate, studytrack) => {
  return Studyright.count({
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
      graduated: 1,
      student_studentnumber: {
        [Op.in]: studentnumbers
      },
      startdate: {
        [Op.between]: [startDate, endDate]
      }
    }
  })
}

// const thesesFromClass = (studentnumbers, startDate) => {
//   return Credit.count({
//     include: {
//       model: Course,
//       attributes: [],
//       required: true,
//       where: {
//         name: {
//           fi: {
//             [Op.like]: "%tutkielma%"
//           }
//         }
//       }
//     },
//     where: {
//       credits: {
//         [Op.gte]: 10
//       },
//       student_studentnumber: {
//         [Op.in]: studentnumbers
//       }
//     }
//   })
// }

const productivityStats = (studentnumbers, startDate, endDate, studytrack) => {
  return Promise.all([creditsAfter(studentnumbers, startDate),
    graduationsFromClass(studentnumbers, startDate, endDate, studytrack)])
  // const theses = await thesesFromClass(studentnumbers, startDate)
}

const getYears = (since) => {
  const years = []
  for(let i = since; i <= new Date().getFullYear(); i++) {
    years.push(i)
  }
  console.log(years)
  return years
}

const throughputStatsForStudytrack = async (studytrack, since) => {
  const years = getYears(since)
  const arr = await Promise.all(years.map(async year => {
    const startDate = `${year}-${semesterStart['FALL']}`
    const endDate = `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
    const studentnumbers = await studentnumbersWithAllStudyrightElements([studytrack], startDate, endDate, false, false)
    const [credits, graduated] = await productivityStats(studentnumbers, startDate, endDate, studytrack)
      return {
        year: `${year}-${year + 1}`,
        credits: credits.map(cr => cr === null ? 0 : cr),
        graduated: graduated
      }
  }))
  return arr
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
  productivityStatsForStudytrack,
  throughputStatsForStudytrack
}