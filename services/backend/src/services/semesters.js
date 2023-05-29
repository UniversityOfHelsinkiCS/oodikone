const moment = require('moment')
const sequelize = require('sequelize')
const { Semester } = require('../models')
const Op = sequelize.Op

const getCurrentSemester = async () => {
  const today = new Date()
  const currentSemester = await Semester.findOne({
    where: {
      startdate: {
        [Op.lte]: today,
      },
      enddate: {
        [Op.gte]: today,
      },
    },
  })
  return currentSemester
}

const getSemestersAndYears = async () => {
  const semesters = await Semester.findAll({})
  const result = semesters.reduce(
    (acc, semester) => {
      const { semestercode, name, yearcode, yearname, startdate, enddate } = semester
      acc.semesters[semestercode] = { semestercode, name, yearcode, startdate, enddate }
      if (!acc.years[yearcode]) acc.years[yearcode] = { yearcode, yearname, startdate, enddate }
      else {
        acc.years[yearcode] = {
          yearcode,
          yearname,
          startdate: moment.min(moment(acc.years[yearcode].startdate), moment(startdate)),
          enddate: moment.max(moment(acc.years[yearcode].enddate), moment(enddate)),
        }
      }
      return acc
    },
    {
      years: {},
      semesters: {},
    }
  )
  return result
}

module.exports = {
  getSemestersAndYears,
  getCurrentSemester,
}
