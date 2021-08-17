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
} = require('../models')

const { parseCredit } = require('./parseCredits')
const Op = Sequelize.Op
const { CourseYearlyStatsCounter } = require('./course_yearly_stats_counter')
const _ = require('lodash')

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

const creditsForCourses = async (codes, anonymizationSalt) => {
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
    },
    order: [['attainment_date', 'ASC']],
  })
  const parsedCredits = credits.map(credit => parseCredit(credit, anonymizationSalt))
  return parsedCredits
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

const allCodeAltenatives = async code => {
  let course = await Course.findAll({
    raw: true,
    attributes: ['id', 'code', 'substitutions'],
    where: {
      code: code,
    },
  })

  const allSubstitutions = _.flatten(course.map(c => c.substitutions))

  let subcodes = []
  if (allSubstitutions) {
    subcodes = await Course.findAll({
      raw: true,
      attributes: ['code'],
      where: {
        id: {
          [Op.in]: allSubstitutions,
        },
      },
    })
  }

  const courses = [...course, ...subcodes]
  const temp = courses
    .map(c => c.code)
    .map(c => {
      if (c.match(/^A/)) return [c, 4] // open university codes come last
      if (c.match(/^\d/)) return [c, 2] // old numeric codes come second
      if (c.match(/^[A-Za-z]/)) return [c, 1] // new letter based codes come first
      return [c, 3] // unknown, comes before open uni?
    })
    .sort((a, b) => a[1] - b[1])
    .map(c => c[0])

  return allSubstitutions ? _.uniq(temp) : [code]
}

const yearlyStatsOfNew = async (coursecode, separate, unifyOpenUniCourses, anonymizationSalt) => {
  let codes = await allCodeAltenatives(coursecode)

  if (isOpenUniCourseCode(coursecode) && !unifyOpenUniCourses) {
    codes = [coursecode]
  }

  if (!isOpenUniCourseCode(coursecode) && !unifyOpenUniCourses) {
    codes = codes.filter(code => !code.match(/^[A][0-9]|^AY/))
  }

  const [credits, course] = await Promise.all([
    creditsForCourses(codes, anonymizationSalt),
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
  const statistics = counter.getFinalStatistics(anonymizationSalt)
  return {
    ...statistics,
    coursecode,
    alternatives: codes,
    name: course.name,
  }
}

const maxYearsToCreatePopulationFrom = async coursecodes => {
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

const courseYearlyStats = async (coursecodes, separate, unifyOpenUniCourses, anonymizationSalt) => {
  const stats = await Promise.all(
    coursecodes.map(code => yearlyStatsOfNew(code, separate, unifyOpenUniCourses, anonymizationSalt))
  )
  return stats
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
    include: {
      model: Organization,
      required: true,
    },
    where: {
      ...nameLikeTerm(name),
      ...codeLikeTerm(code),
    },
  })

  const courses = rawCourses
    .map(
      ({
        id,
        code,
        name,
        latest_instance_date,
        is_study_module,
        coursetypecode,
        startdate,
        max_attainment_date,
        min_attainment_date,
        createdAt,
        updatedAt,
        substitutions,
        organizations,
      }) => {
        return {
          id,
          code,
          name,
          latest_instance_date,
          is_study_module,
          coursetypecode,
          startdate,
          max_attainment_date,
          min_attainment_date,
          createdAt,
          updatedAt,
          substitutions,
          organizations: organizations.map(o => o.id),
        }
      }
    )
    .sort(a => (a.code.match(/^[A-Za-z]{3}[0-9]{1}/) ? -1 : 1))

  let substitutionGroupIndex = 0
  const visited = []

  const organizeSubgroups = course => {
    if (visited.includes(course.code)) return

    let temp = courses.filter(c => (course.substitutions ? course.substitutions.includes(c.id) : false))
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
  console.log(courses)
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
  allCodeAltenatives,
  findOneByCode,
}
