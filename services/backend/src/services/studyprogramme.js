const sequelize = require('sequelize')
const { Op } = sequelize
const moment = require('moment')
const { flatMap } = require('lodash')
const {
  Credit,
  Student,
  Course,
  Provider,
  Studyright,
  StudyrightElement,
  ElementDetails,
  Transfers,
} = require('../models')
const { getAssociations, getAllProgrammes } = require('./studyrights')
const { ThesisCourse, ThesisTypeEnums } = require('../models/models_kone')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { semesterStart, semesterEnd } = require('../util/semester')
const { mapToProviders } = require('../util/utils')

const formatCredit = credit => {
  const { id, credits, attainment_date } = credit
  const year = attainment_date && attainment_date.getFullYear()
  return { id, year, credits }
}

const getTransferredCredits = (provider, since) =>
  Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'credittypecode'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        is_study_module: false,
      },
      include: {
        model: Provider,
        attributes: [],
        required: true,
        where: {
          providercode: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.eq]: [9],
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })

const getCreditsForMajors = (provider, since, studentnumbers) =>
  Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        is_study_module: false,
      },
      include: {
        model: Provider,
        attributes: [],
        required: true,
        where: {
          providercode: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.notIn]: [10, 9],
      },
      attainment_date: {
        [Op.gte]: since,
      },
      student_studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

const getCreditsForProvider = async (provider, since) =>
  (
    await Credit.findAll({
      attributes: ['id', 'course_code', 'credits', 'attainment_date'],
      include: {
        model: Course,
        attributes: ['code'],
        required: true,
        where: {
          is_study_module: false,
        },
        include: {
          model: Provider,
          attributes: [],
          required: true,
          where: {
            providercode: provider,
          },
        },
      },
      where: {
        credittypecode: {
          [Op.notIn]: [10, 9],
        },
        attainment_date: {
          [Op.gte]: since,
        },
      },
    })
  ).map(formatCredit)

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

const findGraduated = async (studytrack, since) =>
  (
    await Studyright.findAll({
      include: {
        model: StudyrightElement,
        attributes: [],
        required: true,
        include: {
          model: ElementDetails,
          attributes: [],
          required: true,
          where: {
            code: studytrack,
          },
        },
      },
      where: {
        graduated: 1,
        enddate: {
          [Op.gte]: since,
        },
      },
    })
  ).map(formatGraduatedStudyright)

const graduatedStatsFromStudyrights = studyrights => {
  const stats = {}
  let graduationTimes = []
  studyrights.forEach(({ year, timeToGraduation }) => {
    const graduated = stats[year] ? stats[year].graduated : 0
    stats[year] = {
      graduated: graduated + 1,
      timesToGraduation: stats[year]
        ? [...stats[year].timesToGraduation, timeToGraduation || 0]
        : [timeToGraduation || 0],
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
      programmeCode: code,
    },
  })
  const courseCodeToThesisCourse = thesiscourses.reduce((acc, tc) => {
    acc[tc.courseCode] = tc
    return acc
  }, {})

  // to fix thesis numbers, (there are students who will do the thesis
  // for old programme but they will show up in the new one since same course code)
  // get first studentnumbers that are actually in the new programme

  const studentNumbers = (
    await StudyrightElement.findAll({
      attributes: ['studentnumber'],
      where: {
        code: {
          [Op.eq]: code,
        },
      },
      raw: true,
    })
  ).map(sn => sn.studentnumber)

  const credits = await Credit.findAll({
    include: {
      model: Course,
      required: true,
      where: {
        code: {
          [Op.in]: thesiscourses.map(tc => tc.courseCode),
        },
      },
    },
    where: {
      credittypecode: {
        [Op.ne]: 10,
      },
      student_studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
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
    ...new Set(flatMap([creditStats, studyrightStats, thesisStats, creditsForMajors, transferredCredits], Object.keys)),
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

const productivityStatsForCode = async (code, since) => {
  const providercode = mapToProviders([code])[0]
  const year = 1950
  const startDate = `${year}-${semesterStart['FALL']}`
  const endDate = `${moment(new Date(), 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
  const studentnumbers = await studentnumbersWithAllStudyrightElements([code], startDate, endDate, false, true)
  const promises = [
    graduatedStatsForStudytrack(code, since),
    productivityStatsForProvider(providercode, since),
    thesisProductivityForStudytrack(code),
    productivityCreditsFromStudyprogrammeStudents(code, since, studentnumbers),
    transferredCreditsForProductivity(code, since),
  ]
  const [studyrightStats, creditStats, thesisStats, creditsForMajors, transferredCredits] = await Promise.all(promises)
  return {
    id: code,
    status: null,
    data: combineStatistics(creditStats, studyrightStats, thesisStats, creditsForMajors, transferredCredits),
  }
}

const creditsAfter = (studentnumbers, startDate) => {
  const failed = ['0', 'Hyl.', 'Luop', 'Eisa']
  return Promise.all(
    studentnumbers.map(student =>
      Credit.sum('credits', {
        where: {
          student_studentnumber: {
            [Op.eq]: student,
          },
          attainment_date: {
            [Op.gte]: startDate,
          },
          isStudyModule: {
            [Op.eq]: false,
          },
          grade: {
            [Op.notIn]: failed,
          },
        },
      })
    )
  )
}

const thesesFromClass = async (studentnumbers, startDate, code) => {
  const thesiscourses = await ThesisCourse.findAll({
    where: {
      programmeCode: code,
    },
  })
  const credits = await Credit.findAll({
    include: {
      model: Course,
      required: true,
      where: {
        code: {
          [Op.in]: thesiscourses.map(tc => tc.courseCode),
        },
      },
    },
    where: {
      credittypecode: {
        [Op.ne]: 10,
      },
      attainment_date: {
        [Op.gte]: startDate,
      },
      student_studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

  const courseCodeToThesisCourse = thesiscourses.reduce((acc, tc) => {
    acc[tc.courseCode] = tc
    return acc
  }, {})
  const courseCodes = credits.map(c => c.course.code)
  const theses = courseCodes.reduce((acc, code) => {
    const thesisType = courseCodeToThesisCourse[code].thesisType
    acc[thesisType] = acc[thesisType] ? acc[thesisType] + 1 : 1
    return acc
  }, {})
  return theses
}

const graduationsFromClass = (studentnumbers, studytrack) =>
  Studyright.findAll({
    include: {
      model: StudyrightElement,
      attributes: [],
      required: true,
      where: {
        code: {
          [Op.eq]: studytrack,
        },
      },
    },
    where: {
      student_studentnumber: {
        [Op.in]: studentnumbers,
      },
      graduated: {
        [Op.eq]: 1,
      },
    },
  })

const gendersFromClass = async studentnumbers => {
  return (
    await Student.findAll({
      attributes: [[sequelize.fn('count', sequelize.col('gender_en')), 'count'], 'gender_en'],
      where: {
        studentnumber: {
          [Op.in]: studentnumbers,
        },
      },
      group: ['gender_en'],
      raw: true,
    })
  ).reduce((acc, curr) => {
    acc[curr.gender_en] = curr.count
    return acc
  }, {})
}

const nationalitiesFromClass = async studentnumbers => {
  return (
    await Student.findAll({
      where: {
        studentnumber: {
          [Op.in]: studentnumbers,
        },
      },
      attributes: ['home_country_en'],
    })
  ).reduce((acc, { home_country_en }) => {
    const country = home_country_en || 'Unknown'
    if (!acc[country]) acc[country] = 0
    acc[country] += 1
    return acc
  }, {})
}

const tranferredToStudyprogram = async (studentnumbers, startDate, studytrack, endDate) =>
  Transfers.count({
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
      transferdate: {
        [Op.between]: [startDate, endDate],
      },
      targetcode: studytrack,
    },
    distinct: true,
    col: 'studentnumber',
  })

const transferredFromStudyprogram = async (studentnumbers, startDate, studytrack, endDate) =>
  Transfers.count({
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
      transferdate: {
        [Op.between]: [startDate, endDate],
      },
      sourcecode: studytrack,
    },
    distinct: true,
    col: 'studentnumber',
  })

const formatCreditsForProductivity = credits => {
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
  const providercode = mapToProviders([studytrack])[0]
  const credits = await getCreditsForMajors(providercode, startDate, studentnumbers)
  const formattedStudentCredits = formatCreditsForProductivity(credits)
  return formattedStudentCredits
}

const transferredCreditsForProductivity = async (studytrack, since) => {
  const providercode = mapToProviders([studytrack])[0]
  const credits = await getTransferredCredits(providercode, since)
  const formattedCredits = formatCreditsForProductivity(credits)
  return formattedCredits
}

const cancelledStudyright = async (studentnumbers, startDate, studytrack, endDate) =>
  Studyright.count({
    include: {
      model: StudyrightElement,
      attributes: [],
      required: true,
      where: {
        code: {
          [Op.eq]: studytrack,
        },
      },
    },
    where: {
      student_studentnumber: {
        [Op.in]: studentnumbers,
      },
      canceldate: {
        [Op.between]: [startDate, endDate],
      },
    },
  })

const startedStudyright = async (studentnumbers, startDate, studytrack, endDate) =>
  Studyright.count({
    include: {
      model: StudyrightElement,
      attributes: [],
      required: true,
      where: {
        code: {
          [Op.eq]: studytrack,
        },
      },
    },
    where: {
      student_studentnumber: {
        [Op.in]: studentnumbers,
      },
      studystartdate: {
        [Op.between]: [startDate, endDate],
      },
    },
  })

const optionData = async (startDate, endDate, code, level) => {
  const programmes = await getAllProgrammes()
  const students = await studentnumbersWithAllStudyrightElements([code], startDate, endDate, false, true)

  let graduated
  let currentExtent
  let optionExtent

  if (level === 'BSC') {
    graduated = { graduated: 1 }
    currentExtent = 1
    optionExtent = 2
  } else if (level === 'MSC') {
    graduated = {}
    currentExtent = 2
    optionExtent = 1
  } else {
    throw new Error('Invalid study level ' + level)
  }

  const currentStudyrights = await Studyright.findAll({
    include: [
      {
        model: StudyrightElement,
        where: {
          code: code,
        },
        attributes: ['startdate'],
      },
    ],
    where: {
      ...graduated,
      extentcode: currentExtent,
      student_studentnumber: {
        [Op.in]: students,
      },
    },
    attributes: ['student_studentnumber', 'givendate', 'studystartdate'],
  })

  const currentStudyrightsMap = currentStudyrights
    .filter(b => b.studystartdate)
    .reduce((obj, studyright) => {
      const acualDate = new Date(Math.max(+studyright.studystartdate, +studyright.studyright_elements[0].startdate))
      obj[studyright.student_studentnumber] = { givendate: studyright.givendate, startdate: acualDate }
      return obj
    }, {})

  const options = await Studyright.findAll({
    include: [
      {
        model: StudyrightElement,
        where: {
          studentnumber: {
            [Op.in]: students,
          },
          code: {
            [Op.in]: programmes.map(p => p.code),
          },
        },
        include: [
          {
            model: ElementDetails,
            attributes: ['name'],
          },
        ],
        attributes: ['code'],
      },
    ],
    where: {
      extentcode: optionExtent,
      student_studentnumber: {
        [Op.in]: students,
      },
    },
    order: [[StudyrightElement, 'startdate', 'DESC']],
    attributes: ['student_studentnumber', 'startdate', 'givendate'],
  })

  const data = {}
  const years = new Set()

  options
    .filter(m => m.student_studentnumber in currentStudyrightsMap)
    .filter(m => m.givendate.getTime() === currentStudyrightsMap[m.student_studentnumber].givendate.getTime())
    .forEach(b => {
      const date = currentStudyrightsMap[b.student_studentnumber].startdate
      const year =
        date.getMonth() > 6 || (date.getMonth() === 6 && date.getDate() == 31)
          ? date.getFullYear()
          : date.getFullYear() - 1
      years.add(year)
      const code = b.studyright_elements[0].code

      if (!data[code]) {
        data[code] = {}
        data[code].name = b.studyright_elements[0].element_detail.name
        data[code].total = 0
      }
      if (!data[code][year]) {
        data[code][year] = 0
      }
      data[code][year] += 1
      data[code].total += 1
    })

  const dataAsArray = Object.keys(data).map(code => {
    const { name, total } = data[code]
    const output = { code, name, total }
    years.forEach(y => (output[y] = data[code][y] || 0))
    return output
  })
  return { data: dataAsArray, years: Array.from(years).sort() }
}

const statsForClass = async (studentnumbers, startDate, studyprogramme, endDate) => {
  return Promise.all([
    creditsAfter(studentnumbers, startDate),
    graduationsFromClass(studentnumbers, studyprogramme),
    thesesFromClass(studentnumbers, startDate, studyprogramme),
    gendersFromClass(studentnumbers),
    tranferredToStudyprogram(studentnumbers, startDate, studyprogramme, endDate),
    nationalitiesFromClass(studentnumbers),
    transferredFromStudyprogram(studentnumbers, startDate, studyprogramme, new Date()),
    cancelledStudyright(studentnumbers, startDate, studyprogramme, new Date()),
    startedStudyright(studentnumbers, startDate, studyprogramme, new Date()),
  ])
}

const getYears = since => {
  const years = []
  for (let i = since; i <= new Date().getFullYear(); i++) {
    years.push(i)
  }
  return years
}

const throughputStatsForCode = async (code, since) => {
  const associations = await getAssociations()
  const studyprogrammeYears = associations.programmes[code] ? associations.programmes[code].enrollmentStartYears : {}

  const totals = {
    credits: {
      mte30: 0,
      mte60: 0,
      mte90: 0,
      mte120: 0,
      mte150: 0,
    },
    genders: {},
    thesisM: 0,
    thesisB: 0,
    students: 0,
    graduated: 0,
    inTargetTime: 0,
    transferred: 0,
    nationalities: {},
    transferredFrom: 0,
    cancelled: 0,
    started: 0,
  }

  const stTotals = {}

  const years = getYears(since)
  // studyprogramme starts with K if bachelors and M if masters
  const graduationTimeLimit = code[0] === 'K' ? 36 : 24
  const median = values => {
    if (values.length === 0) return 0

    values.sort((a, b) => a - b)

    var half = Math.floor(values.length / 2)

    if (values.length % 2) return values[half]

    return (values[half - 1] + values[half]) / 2.0
  }
  let allGraduationTimes = []
  const arr = await Promise.all(
    years.map(async year => {
      const startDate = `${year}-${semesterStart['FALL']}`
      const endDate = `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
      const studytracks = studyprogrammeYears[year] ? Object.keys(studyprogrammeYears[year].studyTracks) : []
      const studytrackdata = await studytracks.reduce(async (acc, curr) => {
        const previousData = await acc
        const studentnumbers = await studentnumbersWithAllStudyrightElements(
          [code, curr],
          startDate,
          endDate,
          false,
          true
        )
        const creditsForStudyprogramme = await productivityCreditsFromStudyprogrammeStudents(
          code,
          startDate,
          studentnumbers
        )
        const [credits, graduated, theses, genders, transferredTo, nationalities, transferredFrom, cancelled, started] =
          await statsForClass(studentnumbers, startDate, code, endDate)
        delete genders[null]
        const creditValues = credits.reduce(
          (acc, curr) => {
            acc.mte30 = curr >= 30 ? acc.mte30 + 1 : acc.mte30
            acc.mte60 = curr >= 60 ? acc.mte60 + 1 : acc.mte60
            acc.mte90 = curr >= 90 ? acc.mte90 + 1 : acc.mte90
            acc.mte120 = curr >= 120 ? acc.mte120 + 1 : acc.mte120
            acc.mte150 = curr >= 150 ? acc.mte150 + 1 : acc.mte150
            return acc
          },
          { mte30: 0, mte60: 0, mte90: 0, mte120: 0, mte150: 0 }
        )

        if (!stTotals[curr]) {
          stTotals[curr] = {
            credits: {
              mte30: 0,
              mte60: 0,
              mte90: 0,
              mte120: 0,
              mte150: 0,
            },
            genders: {},
            thesisM: 0,
            thesisB: 0,
            students: 0,
            graduated: 0,
            inTargetTime: 0,
            transferred: 0,
            nationalities: {},
            transferredFrom: 0,
            cancelled: 0,
            started: 0,
          }
        }

        Object.keys(stTotals[curr].credits).forEach(key => {
          stTotals[curr].credits[key] += creditValues[key]
        })
        Object.keys(genders).forEach(genderKey => {
          stTotals[curr].genders[genderKey] = stTotals[curr].genders[genderKey]
            ? stTotals[curr].genders[genderKey] + Number(genders[genderKey])
            : Number(genders[genderKey])
        })
        Object.keys(nationalities).forEach(nationality => {
          if (!stTotals[curr].nationalities[nationality]) stTotals[curr].nationalities[nationality] = 0
          stTotals[curr].nationalities[nationality] += nationalities[nationality]
        })
        const graduationTimes = graduated.map(g => moment(g.enddate).diff(g.studystartdate, 'months'))
        const inTargetTime = graduationTimes.filter(time => time <= graduationTimeLimit).length
        allGraduationTimes = [...allGraduationTimes, ...graduationTimes]

        stTotals[curr].thesisM = theses.MASTER ? stTotals[curr].thesisM + theses.MASTER : stTotals[curr].thesisM
        stTotals[curr].thesisB = theses.BACHELOR ? stTotals[curr].thesisB + theses.BACHELOR : stTotals[curr].thesisB
        stTotals[curr].students = stTotals[curr].students + credits.length
        stTotals[curr].graduated = stTotals[curr].graduated + graduated.length
        stTotals[curr].medianGraduationTime = median(allGraduationTimes)
        stTotals[curr].inTargetTime = stTotals[curr].inTargetTime + inTargetTime
        stTotals[curr].transferred = stTotals[curr].transferred + transferredTo
        stTotals[curr].transferredFrom += transferredFrom
        stTotals[curr].cancelled += cancelled
        stTotals[curr].started += started
        return {
          ...previousData,
          [curr]: {
            year: `${year}-${year + 1}`,
            credits: credits.map(cr => (cr === null ? 0 : cr)),
            creditsForStudyprogramme: creditsForStudyprogramme,
            graduated: graduated.length,
            medianGraduationTime: median(graduationTimes),
            inTargetTime,
            thesisM: theses.MASTER || 0,
            thesisB: theses.BACHELOR || 0,
            genders,
            creditValues,
            transferred: transferredTo,
            nationalities,
            transferredFrom,
            cancelled,
            started,
          },
        }
      }, {})

      const studentnumbers = await studentnumbersWithAllStudyrightElements([code], startDate, endDate, false, true)
      const creditsForStudyprogramme = await productivityCreditsFromStudyprogrammeStudents(
        code,
        startDate,
        studentnumbers
      )
      const [credits, graduated, theses, genders, transferredTo, nationalities, transferredFrom, cancelled, started] =
        await statsForClass(studentnumbers, startDate, code, endDate)
      // theres so much shit in the data that transefferFrom doesnt rly mean anything

      delete genders[null]
      const creditValues = credits.reduce(
        (acc, curr) => {
          acc.mte30 = curr >= 30 ? acc.mte30 + 1 : acc.mte30
          acc.mte60 = curr >= 60 ? acc.mte60 + 1 : acc.mte60
          acc.mte90 = curr >= 90 ? acc.mte90 + 1 : acc.mte90
          acc.mte120 = curr >= 120 ? acc.mte120 + 1 : acc.mte120
          acc.mte150 = curr >= 150 ? acc.mte150 + 1 : acc.mte150
          return acc
        },
        { mte30: 0, mte60: 0, mte90: 0, mte120: 0, mte150: 0 }
      )
      Object.keys(totals.credits).forEach(key => {
        totals.credits[key] += creditValues[key]
      })
      Object.keys(genders).forEach(genderKey => {
        totals.genders[genderKey] = totals.genders[genderKey]
          ? totals.genders[genderKey] + Number(genders[genderKey])
          : Number(genders[genderKey])
      })
      Object.keys(nationalities).forEach(nationality => {
        if (!totals.nationalities[nationality]) totals.nationalities[nationality] = 0
        totals.nationalities[nationality] += nationalities[nationality]
      })
      const graduationTimes = graduated.map(g => moment(g.enddate).diff(g.studystartdate, 'months'))
      const inTargetTime = graduationTimes.filter(time => time <= graduationTimeLimit).length
      allGraduationTimes = [...allGraduationTimes, ...graduationTimes]

      totals.thesisM = theses.MASTER ? totals.thesisM + theses.MASTER : totals.thesisM
      totals.thesisB = theses.BACHELOR ? totals.thesisB + theses.BACHELOR : totals.thesisB
      totals.students = totals.students + credits.length
      totals.graduated = totals.graduated + graduated.length
      totals.medianGraduationTime = median(allGraduationTimes)
      totals.inTargetTime = totals.inTargetTime + inTargetTime
      totals.transferred = totals.transferred + transferredTo
      totals.transferredFrom += transferredFrom
      totals.cancelled += cancelled
      totals.started += started
      return {
        year: `${year}-${year + 1}`,
        credits: credits.map(cr => (cr === null ? 0 : cr)),
        creditsForStudyprogramme: creditsForStudyprogramme,
        graduated: graduated.length,
        medianGraduationTime: median(graduationTimes),
        inTargetTime,
        thesisM: theses.MASTER || 0,
        thesisB: theses.BACHELOR || 0,
        genders,
        creditValues,
        transferred: transferredTo,
        nationalities,
        transferredFrom,
        cancelled,
        started,
        studytrackdata,
      }
    })
  )
  return { id: code, status: null, data: { years: arr, totals, stTotals } }
}

module.exports = {
  getCreditsForProvider,
  productivityStatsFromCredits,
  productivityStatsForProvider,
  findGraduated,
  graduatedStatsFromStudyrights,
  combineStatistics,
  productivityStatsForCode,
  throughputStatsForCode,
  findProgrammeThesisCredits,
  thesisProductivityFromCredits,
  thesisProductivityForStudytrack,
  optionData,
}
