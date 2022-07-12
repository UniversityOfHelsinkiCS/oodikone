const Sequelize = require('sequelize')
const { Op } = Sequelize
const { Studyright, Student } = require('../models')
const { formatStudyright } = require('./studyprogrammeHelpers')

// const whereStudents = studentnumbers => {
//   return studentnumbers ? studentnumbers : { [Op.not]: null }
// }

const startedStudyrights = async (faculty, since) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        faculty_code: faculty,
        studystartdate: {
          [Op.gte]: since,
        },
        student_studentnumber: { [Op.not]: null },
      },
    })
  ).map(formatStudyright)

module.exports = { startedStudyrights }
