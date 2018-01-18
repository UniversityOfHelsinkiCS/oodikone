const Sequelize = require('sequelize')
const { Studyright } = require('../models')
const { getDate } = require('./database_updater/oodi_data_mapper')
const Op = Sequelize.Op


const createStudyright = (array) => {
  return Studyright.create({
    studyrightid: array.studyRightId,
    canceldate: array.cancelDate,
    cancelorganisation: array.cangelOrganisation,
    enddate: getDate(array.endDate),
    extentcode: array.extentCode,
    givendate: getDate(array.givenDate),
    graduated: array.graduated,
    highlevelname: array.highLevelName,
    prioritycode: array.priorityCode,
    startdate: getDate(array.startDate),
    studystartdate: getDate(array.studyStartDate),
    organization_code: array.organisation,
    student_studentnumber: array.student
  })
}

const byStudent = (studentNumber) => {
  return Studyright.findAll({
    where: {
      student_studentnumber: {
        [Op.eq]: studentNumber
      }
    }
  })
}

module.exports = {
  byStudent, createStudyright
}