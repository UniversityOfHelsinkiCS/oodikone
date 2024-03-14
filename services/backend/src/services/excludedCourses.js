const { Op } = require('sequelize')
const { ExcludedCourse } = require('../models/models_kone')

const addExcludedCourses = async (programmecode, coursecodes, curriculum) => {
  return ExcludedCourse.bulkCreate(
    coursecodes.map(c => ({ programme_code: programmecode, curriculum_version: curriculum, course_code: c }))
  )
}

const removeExcludedCourses = async ({ programmeCode, curriculumVersion, courseCodes }) => {
  return ExcludedCourse.destroy({
    where: {
      programme_code: programmeCode,
      curriculum_version: curriculumVersion,
      course_code: { [Op.in]: courseCodes },
    },
  })
}

module.exports = { addExcludedCourses, removeExcludedCourses }
