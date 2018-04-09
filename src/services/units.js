const Sequelize = require('sequelize')
const { Unit, Studyright } = require('../models')
const Op = Sequelize.Op

const all = () => Unit.findAll()

const findAllEnabled = () => Unit.findAll({
  where: {
    enabled: {
      [Op.eq]: true
    }
  }
})

const byId = (id) => Unit.findById(id)

const hasStudent = async (unitId, studentNumber) => Studyright.findOne({
  where: {
    prioritycode: 1,
    student_studentnumber: studentNumber
  },
  include: {
    model: Unit,
    where: {
      id: unitId
    }
  }
})

module.exports = {
  all, byId, findAllEnabled, hasStudent
}