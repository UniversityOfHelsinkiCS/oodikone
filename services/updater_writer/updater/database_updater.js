const { sequelize, } = require('../database/connection')

const { Student, Credit, Course, CreditTeacher, Teacher, Organisation, CourseRealisationType, Semester, CreditType, CourseType, Discipline, CourseDisciplines } = require('../models/index')
const { updateAttainmentDates } = require('./update_attainment_dates')


const updateStudent = async (student) => {
  const { studentInfo, studyAttainments } = student
  return sequelize.transaction(t => {

    return Promise.all([
      Student.upsert(studentInfo, { transaction: t }),

      Promise.all(studyAttainments.map(({ credit, creditTeachers, teacheres, course }) => {
        Course.upsert(course, { transaction: t })
        if (course.disciplines.length > 0) {
          Promise.all(course.disciplines.map(courseDiscipline => { CourseDisciplines.upsert(courseDiscipline, { transaction: t }) }))
        }
        Credit.upsert(credit, { transaction: t })
      })).catch(console.log),

    ]).then(async (result) => {
      updateAttainmentDates().catch(console.log)
      return result
    }).catch(err => {
      console.log(err)
    })
  })
}

const updateMeta = async ({ faculties, courseRealisationsTypes, semesters, creditTypeCodes, courseTypeCodes, disciplines }) => {
  return sequelize.transaction(t => {

    return Promise.all([
      Promise.all(courseTypeCodes.map(async _ => {
        await CourseType.upsert(_, { transaction: t }).catch(console.log)
      })),
      Promise.all(faculties.map(async _ => {
        await Organisation.upsert(_, { transaction: t }).catch(console.log)
      })),
      Promise.all(courseRealisationsTypes.map(async _ => {
        await CourseRealisationType.upsert(_, { transaction: t }).catch(console.log)
      })),
      Promise.all(semesters.map(async _ => {
        await Semester.upsert(_, { transaction: t }).catch(console.log)
      })),
      Promise.all(creditTypeCodes.map(async _ => {
        await CreditType.upsert(_, { transaction: t }).catch(console.log)
      })),
      Promise.all(disciplines.map(async _ => {
        await Discipline.upsert(_, { transaction: t }).catch(console.log)
      })),

    ]).then(async (result) => {
      return result
    }).catch(err => {
      console.log(err)
    })
  })
}

module.exports = {
  updateStudent, updateMeta
}