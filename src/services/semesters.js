const { Semester } = require('../models/index')

const getSemestersAndYears = async () => {
  const semesters = Semester.findAll()
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