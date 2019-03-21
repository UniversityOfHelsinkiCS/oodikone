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

module.exports = {
  createThesisCourse,
  deleteThesisCourse    
}