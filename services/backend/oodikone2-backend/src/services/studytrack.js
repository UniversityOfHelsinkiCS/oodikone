const sequelize = require('sequelize')
const { Op } = sequelize
const moment = require('moment')
const { flatMap } = require('lodash')
const { Credit, Student, Course, Provider, Studyright, StudyrightElement,
  ElementDetails, Transfers
} = require('../models')
const {
  ThesisCourse, ThesisTypeEnums
} = require('../models/models_kone')
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

const getTransferredCredits = (provider, since) => Credit.findAll({
  attributes: ['id', 'course_code', 'credits', 'attainment_date', 'credittypecode'],
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
      [Op.eq]: [9]
    },
    attainment_date: {
      [Op.gte]: since
    }
  }
})

const getCreditsForMajors = (provider, since, studentnumbers) => Credit.findAll({
  attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
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
    },
    student_studentnumber: {
      [Op.in]: studentnumbers
    },
  }
})

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
  const timeToGraduation = moment(enddate).diff(moment(studystartdate), 'months')
  return { studyrightid, year, timeToGraduation }
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
  let graduationTimes = []
  studyrights.forEach(({ year, timeToGraduation }) => {
    const graduated = stats[year] ? stats[year].graduated : 0
    stats[year] = {
      graduated: graduated + 1,
      timesToGraduation: stats[year] ?
        [...stats[year].timesToGraduation, timeToGraduation || 0] : [timeToGraduation || 0]
    }
    graduationTimes = [...graduationTimes, timeToGraduation || 0]
  })
  return stats
}

const graduatedStatsForStudytrack = async (studytrack, since) => {
  const studyrights = await findGraduated(studytrack, since)
  return graduatedStatsFromStudyrights(studyrights)
}

const findProgrammeThesisCredits = async code => {
  const thesiscourses = await ThesisCourse.findAll({
    model: ThesisCourse,
    where: {
      programmeCode: code
    }
  })
  const courseCodeToThesisCourse = thesiscourses.reduce((acc, tc) => { acc[tc.courseCode] = tc; return acc }, {})

  const credits = await Credit.findAll({
    include: {
      model: Course,
      required: true,
      where: {
        code: {
          [Op.in]: thesiscourses.map(tc => tc.courseCode)
        }
      }
    },
    where: {
      credittypecode: {
        [Op.ne]: 10
      }
    }
  })

  return credits.map(credit => {
    const { id, course, attainment_date } = credit
    const { code } = course
    const year = attainment_date && attainment_date.getFullYear()
    return { id, code, type: courseCodeToThesisCourse[code].thesisType, year }
  })
}

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

const combineStatistics = (creditStats, studyrightStats, thesisStats, creditsForMajors, transferredCredits) => {
  const allYears = [
    ...new Set(
      flatMap(
        [
          creditStats,
          studyrightStats,
          thesisStats,
          creditsForMajors,
          transferredCredits
        ],
        Object.keys
      )
    )
  ]
  const stats = {}
  allYears.forEach(year => {
    const thesis = thesisStats[year] || {}
    stats[year] = {}
    stats[year] = creditStats[year] || { credits: 0, year }
    stats[year].graduated = studyrightStats[year] ? studyrightStats[year].graduated : 0
    // stats[year].medianGraduationTime = studyrightStats[year] ? studyrightStats[year].medianGraduationTime : 0
    stats[year].bThesis = thesis.bThesis || 0
    stats[year].mThesis = thesis.mThesis || 0
    stats[year].creditsForMajors = creditsForMajors[year] || 0
    stats[year].transferredCredits = transferredCredits[year] || 0
  })
  return Object.values(stats)
}

const productivityStatsForStudytrack = async (studytrack, since) => {
  const providercode = studytrackToProviderCode(studytrack)
  const year = new Date(since).getFullYear()
  const startDate = `${year}-${semesterStart['FALL']}`
  const endDate = `${moment(since, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
  const studentnumbers = await studentnumbersWithAllStudyrightElements([studytrack], startDate, endDate, false, false)
  const promises = [
    graduatedStatsForStudytrack(studytrack, since),
    productivityStatsForProvider(providercode, since),
    thesisProductivityForStudytrack(studytrack),
    productivityCreditsFromStudyprogrammeStudents(studytrack, since, studentnumbers),
    transferredCreditsForProductivity(studytrack, since)
  ]
  const [studyrightStats, creditStats, thesisStats, creditsForMajors, transferredCredits] = await Promise.all(
    promises
  )
  return {
    id: studytrack,
    status: null,
    data: combineStatistics(creditStats, studyrightStats, thesisStats, creditsForMajors, transferredCredits)
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
  const thesiscourses = await ThesisCourse.findAll({
    where: {
      programmeCode: code
    }
  })
  const credits = await Credit.findAll({
    include: {
      model: Course,
      required: true,
      where: {
        code: {
          [Op.in]: thesiscourses.map(tc => tc.courseCode)
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
  })

  const courseCodeToThesisCourse = thesiscourses.reduce((acc, tc) => { acc[tc.courseCode] = tc; return acc }, {})
  const courseCodes = credits.map(c => c.course.code)
  const theses = courseCodes.reduce((acc, code) => {
    const thesisType = courseCodeToThesisCourse[code].thesisType
    acc[thesisType] = acc[thesisType] ? acc[thesisType] + 1 : 1
    return acc
  }, {})
  return theses
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
    attributes: [[sequelize.fn('count', sequelize.col('home_country_en')), 'count'], 'home_country_en'],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers
      },
    },
    group: ['home_country_en'],
    raw: true
  }).reduce((acc, curr) => {
    acc[curr.country_en] = curr.count
    return acc
  }, {})
}

const tranferredToStudyprogram = async (studentnumbers, startDate, studytrack, endDate) => {
  return Transfers.count({
    where: {
      studentnumber: {
        [Op.in]: studentnumbers
      },
      transferdate: {
        [Op.between]: [startDate, endDate]
      },
      targetcode: studytrack
    }
  })
}

const endedStudyright = async (studentnumbers, startDate, studytrack, endDate) => {
  const enddate = new Date() < new Date(endDate) ? new Date() : new Date(endDate)
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
        enddate: {
          [Op.gte]: new Date(startDate),
          [Op.lt]: enddate
        }
      }
    },
    where: {
      student_studentnumber: {
        [Op.in]: studentnumbers
      },
      graduated: {
        [Op.eq]: 0
      },
      extentcode: {
        [Op.eq]: 5
      }
    }
  })
}

const formatCreditsForProductivity = (credits) => {
  return credits.map(formatCredit).reduce(function (acc, curr) {
    var key = curr['year']
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key] = Number(acc[key]) + Number(curr.credits)
    return acc
  }, {})
}

const productivityCreditsFromStudyprogrammeStudents = async (studytrack, startDate, studentnumbers) => {
  const providercode = studytrackToProviderCode(studytrack)
  const credits = await getCreditsForMajors(providercode, startDate, studentnumbers)
  const formattedStudentCredits = formatCreditsForProductivity(credits)
  return formattedStudentCredits
}

const transferredCreditsForProductivity = async (studytrack, since) => {
  const providercode = studytrackToProviderCode(studytrack)
  const credits = await getTransferredCredits(providercode, since)
  const formattedCredits = formatCreditsForProductivity(credits)
  return formattedCredits
}

const statsForClass = async (studentnumbers, startDate, studytrack, endDate) => {
  return Promise.all([
    creditsAfter(studentnumbers, startDate),
    graduationsFromClass(studentnumbers, studytrack),
    thesesFromClass(studentnumbers, startDate, studytrack),
    gendersFromClass(studentnumbers),
    countriesFromClass(studentnumbers),
    tranferredToStudyprogram(studentnumbers, startDate, studytrack, endDate),
    endedStudyright(studentnumbers, startDate, studytrack, endDate)
  ])
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
  // studyprogramme starts with K if bachelors and M if masters
  const graduationTimeLimit = studytrack[0] === 'K' ? 36 : 24
  const median = (values) => {
    if (values.length === 0) return 0

    values.sort((a, b) => a - b)

    var half = Math.floor(values.length / 2)

    if (values.length % 2)
      return values[half]

    return (values[half - 1] + values[half]) / 2.0
  }
  let allGraduationTimes = []
  const arr = await Promise.all(years.map(async year => {
    const startDate = `${year}-${semesterStart['FALL']}`
    const endDate = `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
    const studentnumbers = await studentnumbersWithAllStudyrightElements([studytrack], startDate, endDate, false, false)
    const creditsForStudyprogramme =
      await productivityCreditsFromStudyprogrammeStudents(studytrack, startDate, studentnumbers)
    const [credits, graduated, theses, genders, countries, transferredTo, endedStudyright] =
      await statsForClass(studentnumbers, startDate, studytrack, endDate)
    //console.log(year)
    //console.log(transferredFrom.rows.map(r => r.get({ plain: true })))
    // theres so much shit in the data that transefferFrom doesnt rly mean anything
    delete genders[null]
    delete countries[null]
    delete countries[undefined]
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
    const graduationTimes = graduated.map(g => moment(g.enddate).diff(g.studystartdate, 'months'))
    const inTargetTime = graduationTimes.filter(time =>
      time <= graduationTimeLimit).length
    allGraduationTimes = [...allGraduationTimes, ...graduationTimes]

    totals.thesisM = theses.MASTER ? totals.thesisM + theses.MASTER : totals.thesisM
    totals.thesisB = theses.BACHELOR ? totals.thesisB + theses.BACHELOR : totals.thesisB
    totals.students = totals.students + credits.length
    totals.graduated = totals.graduated + graduated.length,
    totals.ended = totals.ended + endedStudyright.count,
    totals.medianGraduationTime = median(allGraduationTimes)
    totals.inTargetTime = totals.inTargetTime + inTargetTime
    totals.transferred = totals.transferred + transferredTo
    return {
      year: `${year}-${year + 1}`,
      credits: credits.map(cr => cr === null ? 0 : cr),
      creditsForStudyprogramme: creditsForStudyprogramme,
      graduated: graduated.length,
      medianGraduationTime: median(graduationTimes),
      inTargetTime,
      thesisM: theses.MASTER || 0,
      thesisB: theses.BACHELOR || 0,
      genders,
      countries,
      creditValues,
      transferred: transferredTo,
      ended: endedStudyright.count
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
