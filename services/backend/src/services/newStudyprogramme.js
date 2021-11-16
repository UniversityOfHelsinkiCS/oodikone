const sequelize = require('sequelize')
const { Op } = sequelize
const moment = require('moment')
const { indexOf } = require('lodash')
const { Credit, Course, Organization, Studyright, StudyrightElement, ElementDetail, Transfer } = require('../models')
const { studentnumbersWithAllStudyrightElements } = require('./populations')
const { semesterStart, semesterEnd } = require('../util/semester')
const { mapToProviders } = require('../util/utils')

const getCreditsForMajors = async (provider, since, studentnumbers) =>
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
        attributes: [],
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
      student_studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

const getYears = since => {
  const years = []
  for (let i = since; i <= new Date().getFullYear(); i++) {
    years.push(i)
  }
  return years
}

const getYearsObject = years => {
  let yearsObject = {}
  for (const year of years) {
    yearsObject = { ...yearsObject, [year]: 0 }
  }
  return yearsObject
}

const startedStudyrights = async (studytrack, since) =>
  await Studyright.findAll({
    include: {
      model: StudyrightElement,
      attributes: [],
      required: true,
      include: {
        model: ElementDetail,
        attributes: [],
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
      attributes: [],
      required: true,
      include: {
        model: ElementDetail,
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

const cancelledStudyRights = async (studytrack, since) => {
  return await Studyright.findAll({
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

const getGraduatedStats = async (studytrack, startDate, years) => {
  const studyrights = await graduatedStudyRights(studytrack, startDate)
  let graphStats = new Array(years.length).fill(0)
  let tableStats = getYearsObject(years)

  studyrights.forEach(({ enddate }) => {
    const graduationYear = enddate.getFullYear()
    graphStats[indexOf(years, graduationYear)] += 1
    tableStats[graduationYear] += 1
  })
  return { graphStats, tableStats }
}

const getStartedStats = async (studytrack, startDate, years) => {
  const studyrights = await startedStudyrights(studytrack, startDate)
  let graphStats = new Array(years.length).fill(0)
  let tableStats = getYearsObject(years)

  studyrights.forEach(({ studystartdate }) => {
    const startYear = studystartdate.getFullYear()
    graphStats[indexOf(years, startYear)] += 1
    tableStats[startYear] += 1
  })
  return { graphStats, tableStats }
}

const getCancelledStats = async (studytrack, startDate, years) => {
  const studyrights = await cancelledStudyRights(studytrack, startDate)
  let graphStats = new Array(years.length).fill(0)
  let tableStats = getYearsObject(years)

  studyrights.forEach(({ canceldate }) => {
    const cancelYear = canceldate.getFullYear()
    graphStats[indexOf(years, cancelYear)] += 1
    tableStats[cancelYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredAwayStats = async (studytrack, startDate, years) => {
  const studyrights = await transfersAway(studytrack, startDate)
  let graphStats = new Array(years.length).fill(0)
  let tableStats = getYearsObject(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = transferdate.getFullYear()
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredToStats = async (studytrack, startDate, years) => {
  const studyrights = await transfersTo(studytrack, startDate)
  let graphStats = new Array(years.length).fill(0)
  let tableStats = getYearsObject(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = transferdate.getFullYear()
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const formatCreditsForProductivity = (credits, years) => {
  let graphStats = new Array(years.length).fill(0)
  credits.forEach(({ attainment_date, credits }) => {
    const attainmentYear = attainment_date.getFullYear()
    graphStats[indexOf(years, attainmentYear)] += credits || 0
  })
  return graphStats
}

const creditsForMajorStudents = async (studytrack, startDate, studentnumbers, years) => {
  const providercode = mapToProviders([studytrack])[0]
  const credits = await getCreditsForMajors(providercode, startDate, studentnumbers)
  const summed = formatCreditsForProductivity(credits, years)
  return summed
}

const getCreditStatsForStudytrack = async ({ studyprogramme, startDate }) => {
  const years = getYears(startDate.getFullYear())
  const year = 1950
  const since = `${year}-${semesterStart['FALL']}`
  const endDate = `${moment(new Date(), 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
  // This includes ALL students: exchange students, the ones that have transferred to program, the ones
  // with non-degree studyright and the ones that have cancelled their studyright
  const studentnumbers = await studentnumbersWithAllStudyrightElements(
    [studyprogramme],
    since,
    endDate,
    true, // exchange students
    true, // cancelled students
    true, // non-degree students
    true // transferred to students
  )
  const creditsForMajors = await creditsForMajorStudents(studyprogramme, startDate, studentnumbers, years)

  return {
    id: studyprogramme,
    years,
    graphStats: [
      {
        name: 'Major students credits',
        data: creditsForMajors,
      },
    ],
  }
}

const getBasicStatsForStudytrack = async ({ studyprogramme, startDate }) => {
  const years = getYears(startDate.getFullYear())
  const started = await getStartedStats(studyprogramme, startDate, years)
  const graduated = await getGraduatedStats(studyprogramme, startDate, years)
  const cancelled = await getCancelledStats(studyprogramme, startDate, years)
  const transferredAway = await getTransferredAwayStats(studyprogramme, startDate, years)
  const transferredTo = await getTransferredToStats(studyprogramme, startDate, years)

  const getTableStats = years =>
    years
      .reverse()
      .map(year => [
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
    tableStats: getTableStats(years),
  }
}

module.exports = {
  getBasicStatsForStudytrack,
  getCreditStatsForStudytrack,
}
