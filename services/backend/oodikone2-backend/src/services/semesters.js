const sequelize = require('sequelize')
const { Semester } = require('../models/index')

const getSemestersAndYears = async () => {
  const semesters = await Semester.findAll({})
  const result = semesters.reduce(
    (acc, semester) => {
      const { semestercode, name, yearcode, yearname, startdate, enddate } = semester
      acc.semesters[semestercode] = { semestercode, name, yearcode, startdate, enddate }
      acc.years[yearcode] = { yearcode, yearname }
      return acc
    },
    {
      years: {},
      semesters: {}
    }
  )
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
