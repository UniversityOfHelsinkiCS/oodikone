const Sequelize = require('sequelize')
const { Studyright } = require('../models')
const { getDate } = require('./database_updater/oodi_data_mapper')
const Op = Sequelize.Op

const parseDate = date => getDate(date, null)

const apiDataToModel = (data, studentNumber, highlevelname) => ({
  studyrightid: data.studyright_id,
  canceldate: data.cancel_date,
  cancelorganisation: data.organisation_code,
  enddate: parseDate(data.end_date),
  extentcode: data.extent_code,
  givendate: parseDate(data.admission_date),
  graduated: Number(data.degree_date !== null),
  highlevelname: highlevelname,
  prioritycode: data.priority,
  startdate: parseDate(data.start_date),
  studystartdate: parseDate(data.study_start_date),
  organization_code: data.organisation_code,
  student_studentnumber: studentNumber
})

const createStudyright = (apiData, studentNumber, highlevelname) => {
  const data = apiDataToModel(apiData, studentNumber, highlevelname)
  return Studyright.create(data)
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