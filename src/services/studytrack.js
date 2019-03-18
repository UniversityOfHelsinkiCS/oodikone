const { Op } = require('sequelize')
const { sequelize } = require('../database/connection')
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

const isMastersThesis = (name, credits) => {
  if (!name) return false
  const nameMatch = (name.en ? !!name.en.toLowerCase().match(/^.*master.*thesis.*$/) : false
  ) || (name.fi ? !!name.fi.toLowerCase().match(/^.*pro gradu.*$/) : false)
  return nameMatch && (credits >= 20)
}

const isBachelorsThesis = (name, credits) => {
  if (!name) return false
  const nameMatch = (name.fi ? (!!name.fi.toLowerCase().match(/^.*kandidaat.*tutkielma.*/)
    && !name.fi.toLowerCase().match(/^.*seminaari.*/)) : false)
    || (name.en ? (!!name.en.toLowerCase().match(/^.*bachelor.*thesis.*/)
      && !name.en.toLowerCase().match(/^.*seminar.*/)) : false)
  return nameMatch && (credits >= 5)
}

const formatCredit = credit => {
  const { id, credits, attainment_date, course: { name } } = credit
  const year = attainment_date && attainment_date.getFullYear()
  const course = name.en
  const mThesis = isMastersThesis(name, credits)
  const bThesis = isBachelorsThesis(name, credits)
  return { id, year, credits, course, mThesis, bThesis }
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
  credits.forEach(({ year, credits: creds, mThesis, bThesis }) => {
    const stat = stats[year] || (stats[year] = { credits: 0, bThesis: 0, mThesis: 0, year })
    stat.credits += creds
    mThesis && stat.mThesis++
    bThesis && stat.bThesis++
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

const degreeCodes = () => {
  const queryBachelors = `SELECT code
  FROM course
  WHERE is_study_module=true
  AND (
    name->>'fi' ILIKE '%kandidaatti%'
    AND NOT name->>'fi' ILIKE '%opinnot%'
    AND NOT name->>'fi' ILIKE '%opintoja%'
  );`

  const queryMasters = `SELECT code
    FROM course 
    WHERE is_study_module=true 
    AND (
      name->>'fi' ILIKE '%maisteri%' 
      AND NOT name->>'fi' ILIKE '%opinnot%'
      AND NOT name->>'fi' ILIKE '%opintoja%'
    );`
  return [
    sequelize.query(queryMasters, { type: sequelize.QueryTypes.SELECT }),
    sequelize.query(queryBachelors, { type: sequelize.QueryTypes.SELECT }),
  ]
}

const graduationsFromClass = (studentnumbers, startDate, mastersCodes, bachelorsCodes) => {
  return [Credit.count({
    where: {
      course_code: {
        [Op.in]: mastersCodes.map(c => c.code)
      },
      student_studentnumber: {
        [Op.in]: studentnumbers
      },
      attainment_date: {
        [Op.gte]: startDate
      }
    }
  }),
  Credit.count({
    where: {
      course_code: {
        [Op.in]: bachelorsCodes.map(c => c.code)
      },
      student_studentnumber: {
        [Op.in]: studentnumbers
      },
      attainment_date: {
        [Op.gte]: startDate
      }
    }
  })]
}

const thesesFromClass = (studentnumbers, startDate) => {
  return [Credit.count({
    include: {
      model: Course,
      attributes: [],
      required: true,
      where: {
        [Op.and]: {
          is_study_module: false,
          [Op.or]: {
            name: {
              fi: {
                [Op.and]: {
                  [Op.iLike]: "%pro gradu%",
                  [Op.iLike]: "%tutkielma%",
                  [Op.notILike]: "%seminaari%",
                  [Op.notILike]: "%ilman tutkielmaa%"
                }
              }
            },
            name: {
              en: {
                [Op.and]: {
                  [Op.iLike]: "%master%",
                  [Op.iLike]: "%thesis%",
                  [Op.notILike]: "%seminar%",
                  [Op.notILike]: "%studies%"
                  
                }
              }
            }
          }
        }
      }
    },
    where: {
      credits: {
        [Op.gte]: 20
      },
      student_studentnumber: {
        [Op.in]: studentnumbers
      },
      attainment_date: {
        [Op.gte]: startDate
      }
    }
  }),
  Credit.count({
    include: {
      model: Course,
      attributes: [],
      required: true,
      where: {
        [Op.and]: {
          is_study_module: false,
          name: {
            [Op.or]: {
              fi: {
                [Op.and]: {
                  [Op.iLike]: "%kandidaatin%",
                  [Op.iLike]: "%tutkielma%",
                  [Op.notILike]: "%opinnot%",
                  [Op.notILike]: "%ilman tutkielmaa%"
                }
              }
            },
            en: {
              [Op.and]: {
                [Op.iLike]: "%bachelor%",
                [Op.iLike]: "%thesis%",
                [Op.notILike]: "%seminar%",
                [Op.notILike]: "%studies%",
              }
            }
          }
        }
      }
    },
    where: {
      credits: {
        [Op.gte]: 5
      },
      student_studentnumber: {
        [Op.in]: studentnumbers
      },
      attainment_date: {
        [Op.gte]: startDate
      }
    }
  })]
}

const productivityStats = (studentnumbers, startDate, mastersCodes, bachelorsCodes) => {
  return Promise.all([creditsAfter(studentnumbers, startDate),
  ...graduationsFromClass(studentnumbers, startDate, mastersCodes, bachelorsCodes),
  ...thesesFromClass(studentnumbers, startDate)])
}

const getYears = (since) => {
  const years = []
  for (let i = since; i <= new Date().getFullYear(); i++) {
    years.push(i)
  }
  return years
}

const throughputStatsForStudytrack = async (studytrack, since) => {
  const years = getYears(since)
  const [mastersCodes, bachelorsCodes] = await Promise.all(degreeCodes())
  const arr = await Promise.all(years.map(async year => {
    const startDate = `${year}-${semesterStart['FALL']}`
    const endDate = `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
    const studentnumbers = await studentnumbersWithAllStudyrightElements([studytrack], startDate, endDate, false, false)
    const [credits, graduatedM, graduatedB, thesisM, thesisB] = await productivityStats(studentnumbers, startDate, mastersCodes, bachelorsCodes)
    return {
      year: `${year}-${year + 1}`,
      credits: credits.map(cr => cr === null ? 0 : cr),
      graduatedB: graduatedB,
      graduatedM: graduatedM,
      thesisM: thesisM,
      thesisB: thesisB
    }
  }))
  return arr
}

module.exports = {
  isBachelorsThesis,
  isMastersThesis,
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