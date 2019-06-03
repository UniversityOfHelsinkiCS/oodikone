const sequelize = require('sequelize')
const { Op } = sequelize
const moment = require('moment')
const { Credit, Student, Course, Provider, Studyright, StudyrightElement,
  ElementDetails, ThesisCourse, ThesisTypeEnums
} = require('../models')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { semesterStart, semesterEnd } = require('../util/semester')
const isNumber = str => !Number.isNaN(Number(str))

const FIVE_YEARS_IN_MONTHS = 60

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

const getCreditsForProvider = (provider, since) => Credit.findAll({
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
      [Op.notIn]: [10, 9]
    },
    attainment_date: {
      [Op.gte]: since
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
const productivityStatsForProvider = async (providercode, since) => {
  const credits = await getCreditsForProvider(providercode, since)
  return productivityStatsFromCredits(credits)
}

const formatGraduatedStudyright = ({ studyrightid, enddate, studystartdate }) => {
  const year = enddate && enddate.getFullYear()
  const inTargetTime = moment(enddate).diff(moment(studystartdate), 'months') <= FIVE_YEARS_IN_MONTHS
  return { studyrightid, year, inTargetTime }
}

const findGraduated = (studytrack, since) => Studyright.findAll({
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
    enddate: {
      [Op.gte]: since
    }
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

const graduatedStatsForStudytrack = async (studytrack, since) => {
  const studyrights = await findGraduated(studytrack, since)
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

const productivityStatsForStudytrack = async (studytrack, since) => {
  const providercode = studytrackToProviderCode(studytrack)
  const promises = [
    graduatedStatsForStudytrack(studytrack, since),
    productivityStatsForProvider(providercode, since),
    thesisProductivityForStudytrack(studytrack)
  ]
  const [studyrightStats, creditStats, thesisStats] = await Promise.all(
    promises
  )
  return {
    id: studytrack,
    status: null,
    data: combineStatistics(creditStats, studyrightStats, thesisStats)
  }
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

const gendersFromClass = async (studentnumbers) => {
  return Student.findAll({
    attributes: [[sequelize.fn('count', sequelize.col('gender_en')), 'count'], 'gender_en'],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers
      },
    },
    group: ['gender_en'],
    raw: true
  }).reduce((acc, curr) => {
    acc[curr.gender_en] = curr.count
    return acc
  }, {})
}

const countriesFromClass = async (studentnumbers) => {
  return Student.findAll({
    attributes: [[sequelize.fn('count', sequelize.col('country_en')), 'count'], 'country_en'],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers
      },
    },
    group: ['country_en'],
    raw: true
  }).reduce((acc, curr) => {
    acc[curr.country_en] = curr.count
    return acc
  }, {})
}

const tranferredToStudyprogram = async (studentnumbers, startDate, studytrack, endDate) => {
  return Studyright.findAndCountAll({
    include: {
      include: {
        model: ElementDetails,
        where: {
          type: {
            [Op.eq]: 20
          }
        }
      },
      model: StudyrightElement,
      required: true,
      where: {
        code: {
          [Op.eq]: studytrack
        },
        startdate: {
          [Op.gt]: moment(startDate).add(1, 'days'), // because somehow startdates have a time that is not 00:00
          [Op.lt]: new Date(endDate)
        }
      }
    },
    where: {
      student_studentnumber: {
        [Op.in]: studentnumbers
      }
    }
  })
}

const productivityStats = async (studentnumbers, startDate, studytrack, endDate) => {
  return Promise.all([creditsAfter(studentnumbers, startDate),
    graduationsFromClass(studentnumbers, studytrack),
    thesesFromClass(studentnumbers, startDate, studytrack),
    gendersFromClass(studentnumbers),
    countriesFromClass(studentnumbers),
    tranferredToStudyprogram(studentnumbers, startDate, studytrack, endDate)])
}

const getYears = (since) => {
  const years = []
  for (let i = since; i <= new Date().getFullYear(); i++) {
    years.push(i)
  }
  return years
}

const throughputStatsForStudytrack = async (studytrack, since) => {
  const totals = {
    credits: {
      mte30: 0,
      mte60: 0,
      mte90: 0,
      mte120: 0,
      mte150: 0,
    },
    genders: {},
    countries: {},
    thesisM: 0,
    thesisB: 0,
    students: 0,
    graduated: 0,
    inTargetTime: 0,
    transferred: 0
  }
  const years = getYears(since)
  const graduationTimeLimit = studytrack[0] === 'K' ? 36 : 24 // studyprogramme starts with K if bachelors and M if masters

  const arr = await Promise.all(years.map(async year => {
    const startDate = `${year}-${semesterStart['FALL']}`
    const endDate = `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
    const studentnumbers = await studentnumbersWithAllStudyrightElements([studytrack], startDate, endDate, false, false)
    const [credits, graduated, theses, genders, countries, transferred] =
      await productivityStats(studentnumbers, startDate, studytrack, endDate)
    delete genders[null]
    delete countries[null]
    
    const creditValues = credits.reduce((acc, curr) => {
      acc.mte30 = curr >= 30 ? acc.mte30 + 1 : acc.mte30
      acc.mte60 = curr >= 60 ? acc.mte60 + 1 : acc.mte60
      acc.mte90 = curr >= 90 ? acc.mte90 + 1 : acc.mte90
      acc.mte120 = curr >= 120 ? acc.mte120 + 1 : acc.mte120
      acc.mte150 = curr >= 150 ? acc.mte150 + 1 : acc.mte150
      return acc
    }, { mte30: 0, mte60: 0, mte90: 0, mte120: 0, mte150: 0 })
    Object.keys(totals.credits).forEach(key => {
      totals.credits[key] += creditValues[key]
    })
    Object.keys(genders).forEach(genderKey => {
      totals.genders[genderKey] = totals.genders[genderKey] ?
        totals.genders[genderKey] + Number(genders[genderKey]) :
        Number(genders[genderKey])
    })
    Object.keys(countries).forEach(countryKey => {
      totals.countries[countryKey] = totals.countries[countryKey] ?
        totals.countries[countryKey] + Number(countries[countryKey]) :
        Number(countries[countryKey])
    })
    const inTargetTime = graduated.filter(g =>
      moment(g.enddate).diff(g.startstududate, 'months') <= graduationTimeLimit).length

    totals.thesisM = theses.MASTER ? totals.thesisM + theses.MASTER : totals.thesisM
    totals.thesisB = theses.BACHELOR ? totals.thesisB + theses.BACHELOR : totals.thesisB
    totals.students = totals.students + credits.length
    totals.graduated = totals.graduated + graduated.length,
    totals.inTargetTime = totals.inTargetTime + inTargetTime,
    totals.transferred = totals.transferred + transferred.count
    return {
      year: `${year}-${year + 1}`,
      credits: credits.map(cr => cr === null ? 0 : cr),
      graduated: graduated.length,
      inTargetTime, 
      thesisM: theses.MASTER || 0,
      thesisB: theses.BACHELOR || 0,
      genders,
      countries,
      creditValues,
      transferred: transferred.count
    }
  }))

  return { id: studytrack, status: null, data: { years: arr, totals } }
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
