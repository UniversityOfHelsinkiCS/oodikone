const sequelize = require('sequelize')
const { Semester } = require('../models/index')
const Op = sequelize.Op

const getCurrentSemester = async () => {
  const today = new Date()
  const currentSemester = await Semester.findOne({
    where: {
      startdate: {
        [Op.lte]: today
      },
      enddate: {
        [Op.gte]: today
      }
    }
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
          startdate: Math.min(acc.years[yearcode].startdate, startdate),
          enddate: Math.max(acc.years[yearcode].enddate, enddate)
        }
      }
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
  getMaxYearcode,
  getCurrentSemester
}
