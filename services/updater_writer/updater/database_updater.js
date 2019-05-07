const { sequelize, } = require('../database/connection')

const { Student, Credit, Course, CreditTeacher, Teacher, Organisation, CourseRealisationType, Semester, CreditType, CourseType, Discipline, CourseDisciplines, SemesterEnrollment } = require('../models/index')
const { updateAttainmentDates } = require('./update_attainment_dates')


const updateStudent = async (student) => {
  const { studentInfo, studyAttainments, semesterEnrollments } = student
  return sequelize.transaction(t => {
    return Promise.all([
      Student.upsert(studentInfo, { transaction: t }),
      Promise.all(semesterEnrollments.map(SE => SemesterEnrollment.upsert(SE, { transaction: t}))),
      Promise.all(studyAttainments.map(({ credit, creditTeachers, teachers, course }) => {
        Course.upsert(course, { transaction: t })
        Promise.all(course.disciplines.map(courseDiscipline => { CourseDisciplines.upsert(courseDiscipline, { transaction: t }) })),
        Credit.upsert(credit, { transaction: t }),
        Promise.all(teachers.map(teacher => Teacher.upsert(teacher, { transaction: t }))),
        Promise.all(creditTeachers.map(cT => CreditTeacher.upsert(cT, { transaction: t })))
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