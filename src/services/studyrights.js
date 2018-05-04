const Sequelize = require('sequelize')
const { Studyright } = require('../models')
const { getDate } = require('./database_updater/oodi_data_mapper')
const Op = Sequelize.Op


const createStudyright = (array) => {
  return Studyright.create({
    studyrightid: array.studyRightId,
    canceldate: getDate(array.cancelDate),
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

const ofPopulations = (conf) => {

  const studyrightRules = conf.studyRights.map(sr => ({ [Op.eq]: sr.name }))

  return Studyright.findAll({
    where: {
      highlevelname: {
        [Op.or]: studyrightRules
      },
      prioritycode: {
        [Op.or]: [1, 30]
      },
      studystartdate: {
        [Op.between]: [conf.enrollmentDates.startDate, conf.enrollmentDates.endDate]
      }
    }
  })
}

module.exports = {
  byStudent, createStudyright, ofPopulations
}