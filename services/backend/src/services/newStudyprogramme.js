const sequelize = require('sequelize')
const { Op } = sequelize
const { indexOf } = require('lodash')
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
const { mapToProviders } = require('../util/utils')

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

const getYearsArray = since => {
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

const getStatsBasis = years => {
  return {
    graphStats: new Array(years.length).fill(0),
    tableStats: getYearsObject(years),
  }
}

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
    },
  })

const getProgrammesStudents = async studyprogramme =>
  (
    await Studyright.findAll({
      attributes: ['studyrightid', 'studystartdate', 'enddate', 'graduated', 'prioritycode', 'extentcode'],
      include: [
        {
          model: StudyrightElement,
          attributes: [],
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
        attributes: [],
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
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ enddate }) => {
    const graduationYear = enddate.getFullYear()
    graphStats[indexOf(years, graduationYear)] += 1
    tableStats[graduationYear] += 1
  })
  return { graphStats, tableStats }
}

const getStartedStats = async (studytrack, startDate, years) => {
  const studyrights = await startedStudyrights(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ studystartdate }) => {
    const startYear = studystartdate.getFullYear()
    graphStats[indexOf(years, startYear)] += 1
    tableStats[startYear] += 1
  })
  return { graphStats, tableStats }
}

const getCancelledStats = async (studytrack, startDate, years) => {
  const studyrights = await cancelledStudyRights(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ canceldate }) => {
    const cancelYear = canceldate.getFullYear()
    graphStats[indexOf(years, cancelYear)] += 1
    tableStats[cancelYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredAwayStats = async (studytrack, startDate, years) => {
  const studyrights = await transfersAway(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = transferdate.getFullYear()
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredToStats = async (studytrack, startDate, years) => {
  const studyrights = await transfersTo(studytrack, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = transferdate.getFullYear()
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const isMajorStudentCredit = (studyright, attainment_date) =>
  studyright &&
  (studyright.prioritycode === 1 || studyright.prioritycode === 30) && // Is studyright state = MAIN or state = GRADUATED
  studyright.studystartdate <= attainment_date && // Has the credit been attained after studying in the programme started
  studyright.enddate >= attainment_date && // Has the credit been attained before the studyright ended
  (!studyright.canceldate || studyright.canceldate >= attainment_date) // If the studyright was cancelled, was the credit attained before it was cancelled

const getRegularCreditStats = async (studytrack, startDate, years) => {
  const providercode = mapToProviders([studytrack])[0]
  const studyrights = await getProgrammesStudents(studytrack)
  const credits = await getCreditsForStudyProgramme(providercode, startDate)

  let majors = getStatsBasis(years)
  let nonMajors = getStatsBasis(years)

  // Map all credits for the studyprogramme and divide them into major students' and nonmajors' credits by year
  credits.forEach(({ student_studentnumber, attainment_date, credits }) => {
    const studyright = studyrights.find(studyright => studyright.studentnumber == student_studentnumber)
    const attainmentYear = attainment_date.getFullYear()
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

const getTransferredCreditStats = async (studytrack, startDate, years) => {
  const providercode = mapToProviders([studytrack])[0]
  const credits = await getTransferredCredits(providercode, startDate)
  const { graphStats, tableStats } = getStatsBasis(years)

  credits.forEach(({ attainment_date, credits }) => {
    const attainmentYear = attainment_date.getFullYear()
    graphStats[indexOf(years, attainmentYear)] += credits || 0
    tableStats[attainmentYear] += credits || 0
  })

  return { graphStats, tableStats }
}

const getCreditStatsForStudytrack = async ({ studyprogramme, startDate }) => {
  const years = getYearsArray(startDate.getFullYear())
  const { majors, nonMajors } = await getRegularCreditStats(studyprogramme, startDate, years)
  const transferred = await getTransferredCreditStats(studyprogramme, startDate, years)

  const getTableStats = years =>
    years
      .reverse()
      .map(year => [year, majors.tableStats[year], nonMajors.tableStats[year], transferred.tableStats[year]])

  return {
    id: studyprogramme,
    years: years.reverse(),
    tableStats: getTableStats(years),
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

const getBasicStatsForStudytrack = async ({ studyprogramme, startDate }) => {
  const years = getYearsArray(startDate.getFullYear()).reverse()
  const started = await getStartedStats(studyprogramme, startDate, years)
  const graduated = await getGraduatedStats(studyprogramme, startDate, years)
  const cancelled = await getCancelledStats(studyprogramme, startDate, years)
  const transferredAway = await getTransferredAwayStats(studyprogramme, startDate, years)
  const transferredTo = await getTransferredToStats(studyprogramme, startDate, years)

  const getTableStats = years =>
    years.map(year => [
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
