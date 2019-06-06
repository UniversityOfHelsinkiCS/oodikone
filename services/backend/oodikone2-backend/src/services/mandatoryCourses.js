const Sequelize = require('sequelize')
const { Course, MandatoryCourse, MandatoryCourseLabels } = require('../models')
const { Op } = Sequelize

const byStudyprogramme = (studyProgrammeId) => {
  const courses = MandatoryCourse.findAll({
    attributes: ['course_code'],
    include: [
      {
        model: Course,
        attributes: ['name'],
      },
      {
        model: MandatoryCourseLabels,
        attributes: ['id', 'label', 'orderNumber'],
      }
    ],
    where: {
      studyprogramme_id: {
        [Op.eq]: studyProgrammeId
      }
    }
  })

  return courses.map(course => ({
    name: course.course.name,
    code: course.course_code,
    label: course.mandatory_course_label
  }))
}

const create = (studyProgrammeId, code) => {
  return MandatoryCourse.create({
    studyprogramme_id: studyProgrammeId,
    course_code: code
  })
}

const find = (studyProgrammeId, code) => {
  return MandatoryCourse.findOne({
    attributes: ['course_code', 'label'],
    include: [
      {
        model: Course,
        attributes: ['name'],
      },
      {
        model: MandatoryCourseLabels,
        attributes: ['id', 'label', 'orderNumber'],
      }
    ],
    where: {
      studyprogramme_id: {
        [Op.eq]: studyProgrammeId
      },
      course_code: {
        [Op.eq]: code
      }
    }
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

const updateLabel = (studyProgrammeId, code, { id }) => {
  return MandatoryCourse.update(
    {
      label: id
    },
    {
      where: {
        course_code: code,
        studyprogramme_id: studyProgrammeId
      }
    }
  )
}

module.exports = {
  create,
  find,
  remove,
  byStudyprogramme,
  updateLabel
}