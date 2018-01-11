const Sequelize = require('sequelize')
const { Credit } = require('../models')
const Op = Sequelize.Op


const createCredit = async (credit, studentNumber, courseInstanceId) => {
  const id = await Credit.max('id') + 1
  return Credit.build({
    id: id,
    grade: credit.grade,
    student_studentnumber: studentNumber,
    credits: credit.credits,
    ordering: credit.ordering,
    status: credit.status,
    statuscode: credit.statusCode,
    courseinstance_id: courseInstanceId,
  })
}

module.exports = { createCredit }