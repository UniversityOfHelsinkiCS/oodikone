const Sequelize = require('sequelize')
const { TagStudent, Tag } = require('../models')

const Op = Sequelize.Op

const getStudentTags = () => TagStudent.findAll({})

const getStudentTagsByStudytrack = (studytrack) => {
  return TagStudent.findAll({
    include: {
      model: Tag,
      attributes: ['tag_id', 'tagname'],
      where: {
        studytrack: {
          [Op.eq]: studytrack
        }
      }
    }
  })
}

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
  getStudentTagsByStudytrack,
  createStudentTag,
  deleteStudentTag
}