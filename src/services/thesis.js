const { ThesisCourse } = require('../models/index')

const createThesisCourse = (programme, course, type) => ThesisCourse.create({
  programmeCode: programme,
  courseCode: course,
  thesisType: type
})

const deleteThesisCourse = (programme, course, type) => ThesisCourse.destroy({
  where: {
    programmeCode: programme,
    courseCode: course,
    thesisType: type
  }
})

const findProgrammeTheses = programme => ThesisCourse.findAll({
  where: {
    programmeCode: programme
  }
})

module.exports = {
  createThesisCourse,
  deleteThesisCourse,
  findProgrammeTheses
}