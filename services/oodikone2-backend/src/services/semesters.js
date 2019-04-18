const { Op } = require('sequelize')
const { Semester } = require('../models/index')

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

module.exports = {
  getSemestersAndYears
}