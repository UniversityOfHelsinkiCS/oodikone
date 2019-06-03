const sequelize = require('sequelize')
const { Semester } = require('../models/index')
const { Op } = sequelize

const getSemestersAndYears = async before => {
  const semesters = await Semester.findAll({
    where: {
      startdate: {
        [Op.lt]: before
      }
    }
  })
  const result = semesters.reduce((acc, semester) => {
    const { semestercode, name, yearcode, yearname }  = semester
    const semesters = { ...acc.semesters, [semestercode]: { semestercode, name, yearcode }}
    const years = { ...acc.years, [yearcode]: { yearcode, yearname }}
    return {
      semesters,
      years
    }
  }, {
    years: {},
    semesters: {}
  })
  return result
}

const getMaxYearcode = async () => {
  const aa = await Semester.findAll({
    attributes: [[sequelize.fn('max', sequelize.col('yearcode')), 'maxYearCode']],
    raw: true
  })
  return aa[0].maxYearCode
}

module.exports = {
  getSemestersAndYears,
  getMaxYearcode
}