const { Credit } = require('../models')

const createCredit = async (credit, studentNumber, courseInstanceId) => {
  const maxId = await Credit.max('id')
  const id = parseInt(maxId) + 1
  return Credit.create({
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

const attainmentToCredit = (attainment, student_studentnumber, courseinstance_id) => ({
  ...attainment,
  student_studentnumber,
  courseinstance_id
})

const createCreditFromAttainment = (attainment, studentNumber, courseInstanceId) => {
  const model = attainmentToCredit(attainment, studentNumber, courseInstanceId)
  return Credit.create(model)
}

const updateCreditGrade = async (credit, newGrade) => {
  return Credit.update({grade: newGrade},{where: {id: credit.id}})
}

module.exports = { createCredit, updateCreditGrade, createCreditFromAttainment }