const Sequelize = require('sequelize')
const { Credit } = require('../models')
const Op = Sequelize.Op


const createCredit = (array, studentNumber, courseInstanceId) => {
  return Credit.create({
    grade: array[4],
    student_studentnumber: studentNumber,
    credits: array[3],
    ordering: array[7],
    status: array[5],
    statuscode: [6],
    courseinstance_id: courseInstanceId,
  }).then(result => {
    console.log('Created new credit' + array[0])
    return
  }).catch(e => {
    console.log('Error creating credit ' + array[0])
    return
  })
}
