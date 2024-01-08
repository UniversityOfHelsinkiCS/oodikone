const { Op } = require('sequelize')
const { Course } = require('../../models')
const { getSortRank } = require('../../util/utils')

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
          // Starts with code or has AY/A in front of the code
          [Op.iRegexp]: `^(AY|ay|A|a)?${code}`,
        },
      }

const byNameAndOrCodeLike = async (name, code) => {
  const rawCourses = await Course.findAll({
    where: {
      ...nameLikeTerm(name),
      ...codeLikeTerm(code),
    },
    order: [['id', 'desc']],
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
  byNameAndOrCodeLike,
  byCodes,
  findOneByCode,
}
