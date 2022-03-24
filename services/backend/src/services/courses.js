const Sequelize = require('sequelize')
const {
  Student,
  Credit,
  Course,
  ElementDetail,
  StudyrightElement,
  Studyright,
  Semester,
  Organization,
  Enrollment,
} = require('../models')

const { parseCredit } = require('./parseCredits')
const Op = Sequelize.Op
const { CourseYearlyStatsCounter } = require('./course_yearly_stats_counter')
const { sortMainCode, getSortRank } = require('../util/utils')
const { parseEnrollment } = require('./parseEnrollments')

const byNameOrCode = (searchTerm, language) =>
  Course.findAll({
    where: {
      [Op.or]: [
        {
          name: {
            [language]: {
              [Op.iLike]: searchTerm,
            },
          },
        },
        {
          code: {
            [Op.like]: searchTerm,
          },
        },
      ],
    },
  })

const byName = (name, language) =>
  Course.findAll({
    where: {
      name: {
        [language]: {
          [Op.eq]: name,
        },
      },
    },
    order: [['latest_instance_date', 'DESC']],
    limit: 1,
  })

const byCode = code => Course.findByPk(code)

const findOneByCode = code => {
  return Course.findOne({
    attributes: ['id', 'code', 'name'],
    where: {
      code: code,
    },
  })
}

const creditsForCourses = async (codes, anonymizationSalt, unification) => {
  let is_open = false

  if (unification === 'open') is_open = true

  if (unification === 'unify') {
    is_open = {
      [Op.in]: [false, true],
    }
  }

  const credits = await Credit.findAll({
    include: [
      {
        model: Student,
        attributes: ['studentnumber'],
        include: {
          model: StudyrightElement,
          attributes: ['code', 'startdate'],
          include: [
            {
              model: ElementDetail,
              attributes: ['name', 'type'],
              where: {
                type: {
                  [Op.eq]: 20,
                },
              },
            },
            {
              model: Studyright,
              attributes: ['prioritycode', 'faculty_code'],
              where: {
                prioritycode: {
                  [Op.eq]: 1,
                },
              },
              include: {
                model: Organization,
              },
            },
          ],
        },
      },
      {
        model: Semester,
        attributes: ['semestercode', 'name', 'yearcode', 'yearname'],
      },
    ],
    where: {
      course_code: {
        [Op.in]: codes,
      },
      student_studentnumber: {
        [Op.ne]: null,
      },
      [Op.or]: [{ is_open }, { is_open: null }],
    },
    order: [['attainment_date', 'ASC']],
  })

  const parsedCredits = credits.map(credit => parseCredit(credit, anonymizationSalt))
  return parsedCredits
}

const enrollmentsForCourses = async (codes, anonymizationSalt, unification) => {
  let is_open = false

  if (unification === 'open') is_open = true

  if (unification === 'unify') {
    is_open = {
      [Op.in]: [false, true],
    }
  }

  const enrollments = await Enrollment.findAll({
    include: [
      {
        model: Student,
        attributes: ['studentnumber'],
        include: {
          model: StudyrightElement,
          attributes: ['code', 'startdate'],
          include: [
            {
              model: ElementDetail,
              attributes: ['name', 'type'],
              where: {
                type: {
                  [Op.eq]: 20,
                },
              },
            },
            {
              model: Studyright,
              attributes: ['prioritycode', 'faculty_code'],
              where: {
                prioritycode: {
                  [Op.eq]: 1,
                },
              },
              include: {
                model: Organization,
              },
            },
          ],
        },
      },
      {
        model: Semester,
        attributes: ['semestercode', 'name', 'yearcode', 'yearname'],
      },
    ],
    where: {
      course_code: {
        [Op.in]: codes,
      },
      studentnumber: {
        [Op.ne]: null,
      },
      enrollment_date_time: { [Op.gte]: new Date('2021-05-31') },
      state: ['ENROLLED', 'CONFIRMED', 'REJECTED', 'ABORTED_BY_STUDENT', 'ABORTED_BY_TEACHER'],
      [Op.or]: [{ is_open }, { is_open: null }],
    },
  })

  return enrollments.map(enrollment => parseEnrollment(enrollment, anonymizationSalt))
}

const bySearchTerm = async (term, language) => {
  const formatCourse = course => ({
    name: course.name[language],
    code: course.code,
    date: course.latest_instance_date,
  })

  try {
    const result = await byNameOrCode(`%${term}%`, language)
    return result.map(formatCourse)
  } catch (e) {
    return {
      error: e,
    }
  }
}

const createCourse = async (code, name, latest_instance_date) =>
  Course.create({
    code,
    name,
    latest_instance_date,
  })

const isOpenUniCourseCode = code => code.match(/^AY?(.+?)(?:en|fi|sv)?$/)

const unifyOpenUniversity = code => {
  const regexresult = isOpenUniCourseCode(code)
  if (!regexresult) return code
  return regexresult[1]
}

const allCodeAlternatives = async code => {
  const course = await Course.findOne({
    where: { code: code },
  })

  return sortMainCode([...course.substitutions, code])
}

const yearlyStatsOfNew = async (coursecode, separate, unification, anonymizationSalt) => {
  const courseForSubs = await Course.findOne({
    where: { code: coursecode },
  })

  let codes = courseForSubs.substitutions ? sortMainCode([...courseForSubs.substitutions, coursecode]) : [coursecode]

  if (unification === 'reqular') {
    codes = codes.filter(course => !isOpenUniCourseCode(course))
  }

  const [credits, enrollments, course] = await Promise.all([
    creditsForCourses(codes, anonymizationSalt, unification),
    enrollmentsForCourses(codes, anonymizationSalt, unification),
    Course.findOne({
      where: {
        code: coursecode,
      },
    }),
  ])

  const counter = new CourseYearlyStatsCounter()

  for (let credit of credits) {
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
    } = credit

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
      enrollment

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

const courseYearlyStats = async (coursecodes, separate, anonymizationSalt) => {
  const statsReqular = await Promise.all(
    coursecodes.map(async code => {
      const unifyStats = await yearlyStatsOfNew(code, separate, 'unify', anonymizationSalt)
      const reqularStats = await yearlyStatsOfNew(code, separate, 'reqular', anonymizationSalt)
      const openStats = await yearlyStatsOfNew(code, separate, 'open', anonymizationSalt)

      return { unifyStats, reqularStats, openStats }
    })
  )

  return statsReqular
}

const nameLikeTerm = name => {
  if (!name) {
    return undefined
  }
  const term = `%${name.trim()}%`
  return {
    name: {
      [Op.or]: {
        fi: {
          [Op.iLike]: term,
        },
        sv: {
          [Op.iLike]: term,
        },
        en: {
          [Op.iLike]: term,
        },
      },
    },
  }
}

const byCodes = codes => {
  return Course.findAll({
    where: {
      code: {
        [Op.in]: codes,
      },
    },
  })
}

const codeLikeTerm = code =>
  !code
    ? undefined
    : {
        code: {
          [Op.iLike]: `%${code.trim()}%`,
        },
      }

const byNameAndOrCodeLike = async (name, code) => {
  let rawCourses = await Course.findAll({
    where: {
      ...nameLikeTerm(name),
      ...codeLikeTerm(code),
    },
  })

  const courses = rawCourses
    .map(course => {
      return { ...course.dataValues }
    })
    .sort((x, y) => getSortRank(y.code) - getSortRank(x.code))

  let substitutionGroupIndex = 0
  const visited = []

  const organizeSubgroups = course => {
    if (visited.includes(course.code)) return

    let temp = []
    if (course.substitutions !== null) {
      temp = courses.filter(c => course.substitutions.includes(c.code))
    }

    temp.unshift(course)
    temp.forEach(cu => {
      if (visited.includes(course.code)) return
      visited.push(cu.id)
      cu.subsId = substitutionGroupIndex
    })
  }

  courses.forEach(course => {
    if (!visited.includes(course.id)) {
      substitutionGroupIndex++
      organizeSubgroups(course)
    }
  })
  return { courses }
}

module.exports = {
  byCode,
  byName,
  bySearchTerm,
  createCourse,
  courseYearlyStats,
  byNameAndOrCodeLike,
  byCodes,
  maxYearsToCreatePopulationFrom,
  unifyOpenUniversity,
  allCodeAlternatives,
  findOneByCode,
}
