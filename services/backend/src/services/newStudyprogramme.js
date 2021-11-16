const sequelize = require('sequelize')
const { Op } = sequelize
const moment = require('moment')
const { indexOf } = require('lodash')
const { Credit, Course, Organization, Studyright, StudyrightElement, ElementDetail, Transfer } = require('../models')
const { getAssociations } = require('./studyrights')
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

const creditsForMajorStudents = async (studytrack, startDate, studentnumbers) => {
  const providercode = mapToProviders([studytrack])[0]
  const credits = await getCreditsForMajors(providercode, startDate, studentnumbers)
  const summed = credits.reduce((sum, credit) => sum + (Number(credit.credits) || 0), 0)
  return summed
}

const getCreditStatsForStudytrack = async ({ studyprogramme, startDate }) => {
  const years = getYears(startDate.getFullYear())
  const associations = await getAssociations()
  const studyprogrammeYears = associations.programmes[studyprogramme]
    ? associations.programmes[studyprogramme].enrollmentStartYears
    : {}

  const majorStudentsCredits = await Promise.all(
    years.map(async year => {
      const startdate = `${year}-${semesterStart['FALL']}`
      const endDate = `${moment(year, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
      const studytracks = studyprogrammeYears[year] ? Object.keys(studyprogrammeYears[year].studyTracks) : []
      const studytrackdata = await studytracks.reduce(async (acc, curr) => {
        const previousData = await acc
        const studentnumbers = await studentnumbersWithAllStudyrightElements(
          [studyprogramme, curr],
          startdate,
          endDate,
          true, // exchange students
          true, // cancelled students
          true, // non-degree students
          true // transferred to students
        )
        const creditsForStudyprogramme = await creditsForMajorStudents(studyprogramme, startdate, studentnumbers)
        return previousData + creditsForStudyprogramme
      }, 0)
      return studytrackdata
    })
  )

  return {
    graphStats: {
      name: 'Major students credits',
      data: majorStudentsCredits,
    },
  }
}

// const getMajorStudentsCredits = async (studytrack, startDate, years, studentnumbers) => {
//   const providercode = mapToProviders([studytrack])[0]
//   const credits = await getCreditsForMajors(providercode, startDate, studentnumbers)
//   let graphStats = new Array(years.length).fill(0)
//   let tableStats = getYearsObject(years)

//   credits.forEach(({ attainment_date }) => {
//     const attaintment_year = attainment_date.getFullYear()
//     graphStats[indexOf(years, attaintment_year)] += 1
//     tableStats[attaintment_year] += 1
//   })

//   return { graphStats, tableStats }
// }

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
