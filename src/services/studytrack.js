const { Op } = require('sequelize')
const moment = require('moment')
const { Credit, Course, Provider, Studyright, StudyrightElement,
  ElementDetails, ThesisCourse, ThesisTypeEnums
} = require('../models')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { semesterStart, semesterEnd } = require('../util/semester')
const isNumber = str => !Number.isNaN(Number(str))

const studytrackToProviderCode = code => {
  const [left, right] = code.split('_')
  const prefix = [...left].filter(isNumber).join('')
  const suffix = `${left[0]}${right}`
  return `${prefix}0-${suffix}`
}

const formatCredit = credit => {
  const { id, credits, attainment_date } = credit
  const year = attainment_date && attainment_date.getFullYear()
  return { id, year, credits }
}

const getCreditsForProvider = (provider) => Credit.findAll({
  attributes: ['id', 'course_code', 'credits', 'attainment_date'],
  include: {
    model: Course,
    attributes: ['code'],
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
  credits.forEach(({ year, credits: creds }) => {
    const stat = stats[year] || (stats[year] = { credits: 0, year })
    stat.credits += creds
  })
  return stats
}

const productivityStatsForProvider = async (providercode) => {
  const credits = await getCreditsForProvider(providercode)
  return productivityStatsFromCredits(credits)
}

const formatGraduatedStudyright = ({ studyrightid, enddate }) => {
  const year = enddate && enddate.getFullYear()
  return { studyrightid, year }
}

const findGraduated = (studytrack) => Studyright.findAll({
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

const graduatedStatsForStudytrack = async (studytrack) => {
  const studyrights = await findGraduated(studytrack)
  return graduatedStatsFromStudyrights(studyrights)
}

const findProgrammeThesisCredits = code => Credit.findAll({
  include: {
    model: Course,
    required: true,
    include: {
      model: ThesisCourse,
      required: true,
      where: {
        programmeCode: code
      }
    }
  },
  where: {
    credittypecode: {
      [Op.ne]: 10
    }
  }
}).map(credit => {
  const { id, course, attainment_date } = credit
  const { code, thesis_courses } = course
  const { thesisType: type } = thesis_courses[0]
  const year = attainment_date && attainment_date.getFullYear()
  return { id, code, type, year }
})

const thesisProductivityFromCredits = credits => {
  const stats = {}
  credits.forEach(({ type, year }) => {
    const yearstat = stats[year] || (stats[year] = { mThesis: 0, bThesis: 0 })
    if (type === ThesisTypeEnums.MASTER) {
      yearstat.mThesis++
    } else if (type === ThesisTypeEnums.BACHELOR) {
      yearstat.bThesis++
    } else {
      return
    }
  })
  return stats
}

const thesisProductivityForStudytrack = async code => {
  const credits = await findProgrammeThesisCredits(code)
  return thesisProductivityFromCredits(credits)
}

const combineStatistics = (creditStats, studyrightStats, thesisStats) => {
  const stats = { ...creditStats }
  Object.keys(stats).forEach(year => {
    const thesis = thesisStats[year] || {}
    stats[year].graduated = studyrightStats[year] || 0
    stats[year].bThesis = thesis.bThesis || 0
    stats[year].mThesis = thesis.mThesis || 0
  })
  return Object.values(stats)
}

const productivityStatsForStudytrack = async (studytrack) => {
  const providercode = studytrackToProviderCode(studytrack)
  const promises = [
    graduatedStatsForStudytrack(studytrack),
    productivityStatsForProvider(providercode),
    thesisProductivityForStudytrack(studytrack)
  ]
  const [studyrightStats, creditStats, thesisStats] = await Promise.all(promises)
  return { [studytrack]: combineStatistics(creditStats, studyrightStats, thesisStats) }
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

const thesesFromClass = async (studentnumbers, startDate, code) => {
  return Credit.findAll({
    include: {
      model: Course,
      required: true,
      include: {
        attributes: ['thesisType'],
        model: ThesisCourse,
        required: true,
        where: {
          programmeCode: code
        }
      }
    },
    where: {
      credittypecode: {
        [Op.ne]: 10
      },
      attainment_date: {
        [Op.gte]: startDate
      },
      student_studentnumber: {
        [Op.in]: studentnumbers
      }
    }
  }).reduce((acc, curr) => {
    curr.course.thesis_courses.map(th => {
      acc[th.thesisType] = acc[th.thesisType] ? acc[th.thesisType] + 1 : 1
    })
    return acc
  }, {})
}

const graduationsFromClass = async (studentnumbers, studytrack) => {
  return Studyright.findAll({
    include: {
      model: StudyrightElement,
      attributes: [],
      required: true,
      where: {
        code: {
          [Op.eq]: studytrack
        }
      }
    },
    where: {
      student_studentnumber: {
        [Op.in]: studentnumbers
      },
      graduated: {
        [Op.eq]: 1
      }

    }
  })
}

const productivityStats = async (studentnumbers, startDate, studytrack) => {
  return Promise.all([creditsAfter(studentnumbers, startDate),
    graduationsFromClass(studentnumbers, studytrack),
    thesesFromClass(studentnumbers, startDate, studytrack)])
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
  const arr = await Promise.all(years.map(async year => {
    const startDate = `${year}-${semesterStart['FALL']}`
    const endDate = `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
    const studentnumbers = await studentnumbersWithAllStudyrightElements([studytrack], startDate, endDate, false, false)
    const [credits, graduated, theses] = await productivityStats(studentnumbers, startDate, studytrack)
    return {
      year: `${year}-${year + 1}`,
      credits: credits.map(cr => cr === null ? 0 : cr),
      graduated: graduated.length,
      thesisM: theses.MASTER,
      thesisB: theses.BACHELOR
    }
  }))
  return { [studytrack]: arr }
}

module.exports = {
  studytrackToProviderCode,
  getCreditsForProvider,
  productivityStatsFromCredits,
  productivityStatsForProvider,
  findGraduated,
  graduatedStatsFromStudyrights,
  combineStatistics,
  productivityStatsForStudytrack,
  throughputStatsForStudytrack,
  findProgrammeThesisCredits,
  thesisProductivityFromCredits,
  thesisProductivityForStudytrack
}
