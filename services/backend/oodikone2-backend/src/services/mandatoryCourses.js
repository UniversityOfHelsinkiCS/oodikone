const Sequelize = require('sequelize')
const { Course } = require('../models')
const { MandatoryCourse, MandatoryCourseLabels } = require('../models/models_kone')
const { Op } = Sequelize

const byStudyprogramme = async (studyProgrammeId) => {
  const mandatoryCourses = await MandatoryCourse.findAll({
    attributes: ['course_code'],
    include: [
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

  const courses = await Course.findAll({
    model: Course,
    where: {
      code: {
        [Op.in]: mandatoryCourses.map(c => c.course_code)
      }
    }
  })
  const courseCodeToCourse = courses.reduce((acc, c) => { acc[c.code] = c; return acc }, {})

  return mandatoryCourses.map(mc => ({
    name: courseCodeToCourse[mc.course_code].name,
    code: mc.course_code,
    label: mc.mandatory_course_label
  }))
}

const create = (studyProgrammeId, code) => {
  return MandatoryCourse.create({
    studyprogramme_id: studyProgrammeId,
    course_code: code
  })
}

const find = async (studyProgrammeId, code) => {
  const mandatoryCourse = await MandatoryCourse.findOne({
    attributes: ['course_code', 'label'],
    include: [
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

  const course = await Course.findOne({
    where: {
      code: mandatoryCourse.course_code
    }
  })

  return { ...mandatoryCourse.get(), course: course.get() }
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