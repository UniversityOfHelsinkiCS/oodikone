const { Op } = require('sequelize')
const { Credit, Course, Organization, Enrollment } = require('../../models')

const { parseCredit } = require('./parseCredits')
const { parseEnrollment } = require('./parseEnrollments')
const { CourseYearlyStatsCounter } = require('./course_yearly_stats_counter')
const { sortMainCode } = require('../../util/utils')
const {
  enrollmentsForCourses,
  creditsForCourses,
  getStudentNumberToSrElementsMap,
} = require('./creditsAndEnrollmentsOfCourse')
const { byNameAndOrCodeLike, byCodes } = require('./courseFinders')

const isOpenUniCourseCode = code => code.match(/^AY?(.+?)(?:en|fi|sv)?$/)

const unifyOpenUniversity = code => {
  const regexresult = isOpenUniCourseCode(code)
  if (!regexresult) return code
  return regexresult[1]
}

const allCodeAlternatives = async code => {
  const course = await Course.findOne({
    where: { code },
  })

  return sortMainCode([...course.substitutions, code])
}

const yearlyStatsOfNew = async (
  coursecode,
  separate,
  unification,
  anonymizationSalt,
  combineSubstitutions,
  studentNumberToSrElementsMap
) => {
  const courseForSubs = await Course.findOne({
    where: { code: coursecode },
  })

  let codes =
    combineSubstitutions && courseForSubs.substitutions
      ? sortMainCode([...courseForSubs.substitutions, coursecode])
      : [coursecode]

  if (unification === 'regular') {
    codes = codes.filter(course => !isOpenUniCourseCode(course))
  }

  const [credits, enrollments, course] = await Promise.all([
    creditsForCourses(codes, anonymizationSalt, unification),
    enrollmentsForCourses(codes, unification),
    Course.findOne({
      where: {
        code: coursecode,
      },
    }),
  ])

  const counter = new CourseYearlyStatsCounter()

  for (const credit of credits) {
    const {
      studentnumber,
      grade,
      passed,
      semestercode,
      semestername,
      yearcode,
      yearname,
      attainment_date,
      programmes,
      coursecode,
      credits,
    } = parseCredit(credit, anonymizationSalt, studentNumberToSrElementsMap)

    const groupcode = separate ? semestercode : yearcode
    const groupname = separate ? semestername : yearname
    const unknownProgramme = [
      {
        code: 'OTHER',
        name: {
          en: 'Other',
          fi: 'Muu',
          sv: 'Andra',
        },
        faculty_code: 'OTHER',
        organization: {
          name: {
            en: 'Other',
            fi: 'Muu',
            sv: 'Andra',
          },
        },
      },
    ]
    counter.markStudyProgrammes(
      studentnumber,
      programmes.length === 0 ? unknownProgramme : programmes,
      yearcode,
      passed,
      credits
    )
    counter.markCreditToGroup(studentnumber, passed, grade, groupcode, groupname, coursecode, yearcode)
    counter.markCreditToStudentCategories(studentnumber, passed, attainment_date, groupcode)
  }

  enrollments.forEach(enrollment => {
    const { studentnumber, semestercode, semestername, yearcode, yearname, coursecode, state, enrollment_date_time } =
      parseEnrollment(enrollment, anonymizationSalt, studentNumberToSrElementsMap)

    const groupcode = separate ? semestercode : yearcode
    const groupname = separate ? semestername : yearname

    counter.markEnrollmentToGroup(
      studentnumber,
      state,
      enrollment_date_time,
      groupcode,
      groupname,
      coursecode,
      yearcode
    )
  })

  const statistics = counter.getFinalStatistics(anonymizationSalt)

  return {
    ...statistics,
    coursecode,
    alternatives: codes,
    name: course.name,
  }
}

const maxYearsToCreatePopulationFrom = async (coursecodes, unifyCourses) => {
  let is_open = false

  if (unifyCourses === 'openStats') is_open = true

  if (unifyCourses === 'unifyStats') {
    is_open = {
      [Op.in]: [false, true],
    }
  }

  const maxAttainmentDate = new Date(
    Math.max(
      ...(
        await Course.findAll({
          where: {
            code: {
              [Op.in]: coursecodes,
            },
          },
          attributes: ['max_attainment_date'],
        })
      ).map(c => new Date(c.max_attainment_date).getTime())
    )
  )

  const attainmentThreshold = new Date(maxAttainmentDate.getFullYear(), 0, 1)
  attainmentThreshold.setFullYear(attainmentThreshold.getFullYear() - 6)

  const credits = await Credit.findAll({
    where: {
      course_code: {
        [Op.in]: coursecodes,
      },
      attainment_date: {
        [Op.gt]: attainmentThreshold,
      },
      is_open,
    },
    order: [['attainment_date', 'ASC']],
  })

  const yearlyStudents = Object.values(
    credits.reduce((res, credit) => {
      const attainmentYear = new Date(credit.attainment_date).getFullYear()
      if (!res[attainmentYear]) res[attainmentYear] = 0
      res[attainmentYear]++
      return res
    }, {})
  )
  const maxYearsToCreatePopulationFrom = Math.max(
    Math.floor(
      1200 / // Lower this value to get a smaller result if necessary
        (yearlyStudents.reduce((acc, curr) => acc + curr, 0) / yearlyStudents.length)
    ),
    1
  )

  return maxYearsToCreatePopulationFrom
}

const courseYearlyStats = async (coursecodes, separate, anonymizationSalt, combineSubstitutions) => {
  const credits = await Credit.findAll({
    attributes: ['student_studentnumber'],
    where: { course_code: { [Op.in]: coursecodes } },
  })

  const enrollment = await Enrollment.findAll({
    attributes: ['studentnumber'],
    where: { course_code: { [Op.in]: coursecodes } },
  })

  const studentnumbersObject = {}

  credits.forEach(cr => {
    studentnumbersObject[cr.student_studentnumber] = true
  })
  enrollment.forEach(cr => {
    studentnumbersObject[cr.studentnumber] = true
  })

  const studentNumberToSrElementsMap = await getStudentNumberToSrElementsMap(Object.keys(studentnumbersObject))

  const statsRegular = await Promise.all(
    coursecodes.map(async code => {
      const unifyStats = await yearlyStatsOfNew(
        code,
        separate,
        'unify',
        anonymizationSalt,
        combineSubstitutions,
        studentNumberToSrElementsMap
      )
      const regularStats = await yearlyStatsOfNew(
        code,
        separate,
        'regular',
        anonymizationSalt,
        combineSubstitutions,
        studentNumberToSrElementsMap
      )
      const openStats = await yearlyStatsOfNew(
        code,
        separate,
        'open',
        anonymizationSalt,
        combineSubstitutions,
        studentNumberToSrElementsMap
      )

      return { unifyStats, regularStats, openStats }
    })
  )

  return statsRegular
}

const getCourseProvidersForCourses = async codes => {
  return (
    await Organization.findAll({
      attributes: ['code'],
      include: {
        model: Course,
        where: {
          code: {
            [Op.in]: codes,
          },
        },
      },
      raw: true,
    })
  ).map(({ code }) => code)
}

module.exports = {
  courseYearlyStats,
  maxYearsToCreatePopulationFrom,
  unifyOpenUniversity,
  allCodeAlternatives,
  getCourseProvidersForCourses,
  byCodes,
  byNameAndOrCodeLike,
}
