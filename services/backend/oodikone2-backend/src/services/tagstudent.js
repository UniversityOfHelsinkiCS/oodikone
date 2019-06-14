const Sequelize = require('sequelize')
const { TagStudent } = require('../models')

const Op = Sequelize.Op

const getStudentTags = () => TagStudent.findAll({})

const getStudentTagsByStudentnumber = async (studentnumber) => {
  return TagStudent.findAll({
    where: {
      studentnumber: {
        [Op.eq]: studentnumber
      }
    }
  })
}

const createStudentTag = async (tag) => {
  return TagStudent.create(tag)
}

const deleteStudentTag = async (tag) => {
  return TagStudent.destroy({
    where: {
      tag_id: {
        [Op.eq]: tag.tag_id
      },
      studentnumber: {
        [Op.eq]: tag.studentnumber
      }
    }
  })
}

module.exports = {
  getStudentTags,
  getStudentTagsByStudentnumber,
  createStudentTag,
  deleteStudentTag
}