const Sequelize = require('sequelize')
const { Course, MandatoryCourse } = require('../models')
const { Op } = Sequelize

const byStudyprogramme = (studyProgrammeId) => {
  const courses = MandatoryCourse.findAll({
    attributes: ['course_code'],
    include: {
      model: Course,
      attributes: ['name'],
    },
    where: {
      studyprogramme_id: {
        [Op.eq]: studyProgrammeId
      }
    }
  })
  return courses.map(course => ({
    name: course.course.name,
    code: course.course_code
  }))
}

const create = (studyProgrammeId, code) => {
  return MandatoryCourse.create({
    studyprogramme_id: studyProgrammeId,
    course_code: code
  })
}

const remove = (studyProgrammeId, code) => {
  return MandatoryCourse.destroy({
    where: {
      studyprogramme_id: studyProgrammeId,
      course_code: code
    }
  })
}

module.exports = {
  create,
  remove,
  byStudyprogramme
}