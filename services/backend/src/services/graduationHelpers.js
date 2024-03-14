const { Op } = require('sequelize')
const moment = require('moment')
const { Semester, SemesterEnrollment, Studyright } = require('../models')

// categorize graduation times

const countTimeCategories = (times, goal) => {
  const statistics = { onTime: 0, yearOver: 0, wayOver: 0 }
  times.forEach(time => {
    if (time <= goal) statistics.onTime += 1
    else if (time <= goal + 12) statistics.yearOver += 1
    else statistics.wayOver += 1
  })
  return statistics
}

// discount staturory absences from graduation times

const formatAbsence = absence => {
  const { semestercode, semester } = absence
  return { semestercode, start: semester.startdate, end: semester.enddate }
}

const statutoryAbsences = async (studentnumber, startdate, enddate) =>
  (
    await SemesterEnrollment.findAll({
      attributes: ['semestercode'],
      include: {
        model: Semester,
        attributes: ['startdate', 'enddate'],
        where: {
          startdate: {
            [Op.gte]: startdate,
          },
          enddate: {
            [Op.lte]: enddate,
          },
        },
      },
      where: {
        studentnumber,
        statutory_absence: true,
      },
    })
  ).map(formatAbsence)

const getStatutoryAbsences = async (studentnumber, startdate, enddate) => {
  const absences = await statutoryAbsences(studentnumber, startdate, enddate)
  if (absences.length) {
    const absentMonths = absences.reduce((sum, ab) => sum + moment(ab.end).diff(moment(ab.start), 'months'), 0)
    return absentMonths
  }
  return 0
}

// count bachelor time in Bc+Ms studyrights to master graduation times

const bachelorStudyright = async id => {
  return await Studyright.findOne({
    attributes: ['startdate'],
    where: {
      studyrightid: id,
      extentcode: 1,
    },
  })
}

module.exports = {
  countTimeCategories,
  getStatutoryAbsences,
  bachelorStudyright,
}
