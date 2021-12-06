const sequelize = require('sequelize')
const { Op } = sequelize
const moment = require('moment')
const { indexOf, mean } = require('lodash')
const {
  Credit,
  Course,
  Organization,
  Studyright,
  StudyrightElement,
  ElementDetail,
  Transfer,
  Student,
} = require('../models')
const { ThesisCourse } = require('../models/models_kone')

const { mapToProviders } = require('../util/utils')

// Helper functions
const formatStudyright = studyright => {
  const { studyrightid, studystartdate, enddate, graduated, prioritycode, extentcode, student } = studyright
  return {
    studyrightid,
    studystartdate,
    enddate,
    graduated,
    prioritycode,
    extentcode,
    studentnumber: student.studentnumber,
  }
}

const getYearsArray = (since, isAcademicYear) => {
  const years = []
  for (let i = since; i <= new Date().getFullYear(); i++) {
    const year = isAcademicYear ? `${i} - ${i + 1}` : i
    years.push(year)
  }
  return years
}

const getYearsObject = (years, emptyArrays = false) => {
  let yearsObject = {}
  for (const year of years) {
    yearsObject = { ...yearsObject, [year]: emptyArrays ? [] : 0 }
  }
  return yearsObject
}

const getStatsBasis = years => {
  return {
    graphStats: new Array(years.length).fill(0),
    tableStats: getYearsObject(years),
  }
}

const isMajorStudentCredit = (studyright, attainment_date) =>
  studyright &&
  (studyright.prioritycode === 1 || studyright.prioritycode === 30) && // Is studyright state = MAIN or state = GRADUATED
  studyright.studystartdate <= attainment_date && // Has the credit been attained after studying in the programme started
  studyright.enddate >= attainment_date && // Has the credit been attained before the studyright ended
  (!studyright.canceldate || studyright.canceldate >= attainment_date) // If the studyright was cancelled, was the credit attained before it was cancelled

const getMedian = values => {
  if (values.length === 0) return 0
  values.sort((a, b) => a - b)
  const half = Math.floor(values.length / 2)
  if (values.length % 2) return values[half]
  return (values[half - 1] + values[half]) / 2.0
}

const getMean = values => {
  if (values.length === 0) return 0
  return Math.round(mean(values))
}

// db-queries
const getCreditsForStudyProgramme = async (provider, since) =>
  await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        is_study_module: false,
      },
      include: {
        model: Organization,
        required: true,
        where: {
          code: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.notIn]: [10, 9, 7],
      },
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })

const getProgrammesStudents = async studyprogramme =>
  (
    await Studyright.findAll({
      attributes: ['studyrightid', 'studystartdate', 'enddate', 'graduated', 'prioritycode', 'extentcode'],
      include: [
        {
          model: StudyrightElement,
          required: true,
          where: {
            code: {
              [Op.in]: [studyprogramme],
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
    })
  ).map(formatStudyright)

const getTransferredCredits = async (provider, since) =>
  await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'credittypecode', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        is_study_module: false,
      },
      include: {
        model: Organization,
        required: true,
        where: {
          code: provider,
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

const getThesisCredits = async (studyprogramme, startDate) => {
  const thesiscourses = await ThesisCourse.findAll({
    where: {
      programmeCode: studyprogramme,
    },
  })
  return await Credit.findAll({
    include: {
      model: Course,
      required: true,
      distinct: true,
      col: 'student_studentnumber',
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
    },
  })
}

const startedStudyrights = async (studytrack, since) =>
  await Studyright.findAll({
    include: {
      model: StudyrightElement,
      required: true,
      include: {
        model: ElementDetail,
        required: true,
        where: {
          code: studytrack,
        },
      },
    },
    where: {
      studystartdate: {
        [Op.gte]: since,
      },
    },
  })

const graduatedStudyRights = async (studytrack, since) =>
  await Studyright.findAll({
    include: {
      model: StudyrightElement,
      required: true,
      include: {
        model: ElementDetail,
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

const cancelledStudyRights = async (studytrack, since) => {
  return await Studyright.findAll({
    include: {
      model: StudyrightElement,
      required: true,
      where: {
        code: {
          [Op.eq]: studytrack,
        },
      },
    },
    where: {
      canceldate: {
        [Op.gte]: since,
      },
    },
  })
}

const transfersAway = async (studytrack, startDate) => {
  return await Transfer.findAll({
    where: {
      transferdate: {
        [Op.gte]: startDate,
      },
      sourcecode: studytrack,
    },
    distinct: true,
    col: 'studentnumber',
  })
}

const transfersTo = async (studytrack, startDate) => {
  return await Transfer.findAll({
    where: {
      transferdate: {
        [Op.gte]: startDate,
      },
      targetcode: studytrack,
    },
    distinct: true,
    col: 'studentnumber',
  })
}

const defineYear = (date, isAcademicYear) => {
  if (!date) return ''
  const year = date.getFullYear()
  if (!isAcademicYear) return year
  if (date < new Date(`${year}-07-31`)) return `${year - 1} - ${year}`
  return `${year} - ${year + 1}`
}

const getGraduatedStats = async (studytrack, startDate, years, isAcademicYear) => {
  const studyrights = await graduatedStudyRights(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ enddate }) => {
    const graduationYear = defineYear(enddate, isAcademicYear)
    graphStats[indexOf(years, graduationYear)] += 1
    tableStats[graduationYear] += 1
  })
  return { graphStats, tableStats }
}

const getStartedStats = async (studytrack, startDate, years, isAcademicYear) => {
  const studyrights = await startedStudyrights(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ studystartdate }) => {
    const startYear = defineYear(studystartdate, isAcademicYear)
    graphStats[indexOf(years, startYear)] += 1
    tableStats[startYear] += 1
  })
  return { graphStats, tableStats }
}

const getCancelledStats = async (studytrack, startDate, years, isAcademicYear) => {
  const studyrights = await cancelledStudyRights(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ canceldate }) => {
    const cancelYear = defineYear(canceldate, isAcademicYear)
    graphStats[indexOf(years, cancelYear)] += 1
    tableStats[cancelYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredAwayStats = async (studytrack, startDate, years, isAcademicYear) => {
  const studyrights = await transfersAway(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredToStats = async (studytrack, startDate, years, isAcademicYear) => {
  const studyrights = await transfersTo(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getRegularCreditStats = async (studytrack, startDate, years, isAcademicYear) => {
  const providercode = mapToProviders([studytrack])[0]
  const studyrights = await getProgrammesStudents(studytrack)
  const credits = await getCreditsForStudyProgramme(providercode, startDate)

  let majors = getStatsBasis(years)
  let nonMajors = getStatsBasis(years)

  credits.forEach(({ student_studentnumber, attainment_date, credits }) => {
    const studyright = studyrights.find(studyright => studyright.studentnumber == student_studentnumber)
    const attainmentYear = defineYear(attainment_date, isAcademicYear)

    // Map all credits for the studyprogramme and
    // divide them into major students' and nonmajors' credits by year
    if (isMajorStudentCredit(studyright, attainment_date)) {
      majors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      majors.tableStats[attainmentYear] += credits || 0
    } else {
      nonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      nonMajors.tableStats[attainmentYear] += credits || 0
    }
  })

  return { majors, nonMajors }
}

const getTransferredCreditStats = async (studytrack, startDate, years, isAcademicYear) => {
  const providercode = mapToProviders([studytrack])[0]
  const credits = await getTransferredCredits(providercode, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  credits.forEach(({ attainment_date, credits }) => {
    const attainmentYear = defineYear(attainment_date, isAcademicYear)
    graphStats[indexOf(years, attainmentYear)] += credits || 0
    tableStats[attainmentYear] += credits || 0
  })

  return { graphStats, tableStats }
}

const getThesisStats = async (studytrack, startDate, years) => {
  const credits = await getThesisCredits(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  credits.forEach(({ attainment_date }) => {
    const attainmentYear = attainment_date.getFullYear()
    graphStats[indexOf(years, attainmentYear)] += 1
    tableStats[attainmentYear] += 1
  })

  return { graphStats, tableStats }
}

const getGraduationTimeStats = async (studytrack, startDate, years) => {
  const studyrights = await graduatedStudyRights(studytrack, startDate)
  let graduationAmounts = getYearsObject(years)
  let graduationTimes = getYearsObject(years, true)

  studyrights.forEach(({ enddate, studystartdate }) => {
    const graduationYear = enddate?.getFullYear()
    const timeToGraduation = moment(enddate).diff(moment(studystartdate), 'months')
    graduationAmounts[graduationYear] += 1
    graduationTimes[graduationYear] = [...graduationTimes[graduationYear], timeToGraduation]
  })

  const medians = getYearsObject(years, true)
  const means = getYearsObject(years, true)

  // The maximum amount of months in the graph depends on the studyprogramme intended graduation time
  const comparisonValue = studytrack.includes('KH') ? 72 : 48

  // HighCharts graph require the data to have this format (ie. actual value, "empty value")
  years.forEach(year => {
    const median = getMedian(graduationTimes[year])
    const mean = getMean(graduationTimes[year])
    medians[year] = [
      ['', median],
      ['', comparisonValue - median],
    ]
    means[year] = [
      ['', mean],
      ['', comparisonValue - mean],
    ]
  })
  return { medians, means, graduationAmounts }
}

const getStartDate = (studyprogramme, isAcademicYear) => {
  if ((studyprogramme.includes('KH') || studyprogramme.includes('MH')) && isAcademicYear) return new Date('2017-08-01')
  if (studyprogramme.includes('KH') || studyprogramme.includes('MH')) return new Date('2017-01-01')
  if (isAcademicYear) return new Date('2000-08-01')
  return new Date('2000-01-01')
}

const getBasicStatsForStudytrack = async ({ studyprogramme, yearType }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const startDate = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(startDate.getFullYear(), isAcademicYear)
  const started = await getStartedStats(studyprogramme, startDate, years, isAcademicYear)
  const graduated = await getGraduatedStats(studyprogramme, startDate, years, isAcademicYear)
  const cancelled = await getCancelledStats(studyprogramme, startDate, years, isAcademicYear)
  const transferredAway = await getTransferredAwayStats(studyprogramme, startDate, years, isAcademicYear)
  const transferredTo = await getTransferredToStats(studyprogramme, startDate, years, isAcademicYear)

  const reversedYears = getYearsArray(startDate.getFullYear(), isAcademicYear).reverse()
  const tableStats = reversedYears.map(year => [
    year,
    started.tableStats[year],
    graduated.tableStats[year],
    cancelled.tableStats[year],
    transferredAway.tableStats[year],
    transferredTo.tableStats[year],
  ])

  return {
    id: studyprogramme,
    years,
    graphStats: [
      {
        name: 'Started',
        data: started.graphStats,
      },
      {
        name: 'Graduated',
        data: graduated.graphStats,
      },
      {
        name: 'Cancelled',
        data: cancelled.graphStats,
      },
      {
        name: 'Transferred away',
        data: transferredAway.graphStats,
      },
      {
        name: 'Transferred To',
        data: transferredTo.graphStats,
      },
    ],
    tableStats,
  }
}

const getCreditStatsForStudytrack = async ({ studyprogramme, yearType }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const startDate = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(startDate.getFullYear(), isAcademicYear)
  const { majors, nonMajors } = await getRegularCreditStats(studyprogramme, startDate, years, isAcademicYear)
  const transferred = await getTransferredCreditStats(studyprogramme, startDate, years, isAcademicYear)

  const reversedYears = getYearsArray(startDate.getFullYear(), isAcademicYear).reverse()
  const tableStats = reversedYears.map(year => [
    year,
    majors.tableStats[year],
    nonMajors.tableStats[year],
    transferred.tableStats[year],
  ])

  return {
    id: studyprogramme,
    years,
    tableStats,
    graphStats: [
      {
        name: 'Major students credits',
        data: majors.graphStats,
      },
      {
        name: 'Non-major students credits',
        data: nonMajors.graphStats,
      },
      {
        name: 'Transferred credits',
        data: transferred.graphStats,
      },
    ],
  }
}

const getGraduationStatsForStudytrack = async ({ studyprogramme, startDate }) => {
  const years = getYearsArray(startDate.getFullYear())
  const thesis = await getThesisStats(studyprogramme, startDate, years)
  const graduated = await getGraduatedStats(studyprogramme, startDate, years)
  const graduationTimeStats = await getGraduationTimeStats(studyprogramme, startDate, years)

  const reversedYears = getYearsArray(startDate.getFullYear()).reverse()
  const tableStats = reversedYears.map(year => [year, graduated.tableStats[year], thesis.tableStats[year]])

  return {
    id: studyprogramme,
    years,
    tableStats,
    graphStats: [
      {
        name: 'Graduated students',
        data: graduated.graphStats,
      },
      {
        name: 'Wrote thesis',
        data: thesis.graphStats,
      },
    ],
    graduationMedianTime: graduationTimeStats.medians,
    graduationMeanTime: graduationTimeStats.means,
    graduationAmounts: graduationTimeStats.graduationAmounts,
  }
}

module.exports = {
  getBasicStatsForStudytrack,
  getCreditStatsForStudytrack,
  getGraduationStatsForStudytrack,
}
