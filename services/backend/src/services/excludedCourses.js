const Sequelize = require('sequelize')
const { ExcludedCourse } = require('../models/models_kone')
const { Op } = Sequelize

const addExcludedCourses = async (programmecode, coursecodes) => {
  return ExcludedCourse.bulkCreate(coursecodes.map(c => ({ programme_code: programmecode, course_code: c })))
}

const removeExcludedCourses = async ids => {
  return ExcludedCourse.destroy({
    where: {
      id: {
        [Op.or]: ids,
      },
    },
  })
}

module.exports = { addExcludedCourses, removeExcludedCourses }
