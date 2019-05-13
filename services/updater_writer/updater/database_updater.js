const { sequelize, } = require('../database/connection')

const {
  Student, Credit, Course, CreditTeacher, Teacher,
  Organisation, CourseRealisationType,
  Semester, CreditType, CourseType, Discipline,
  CourseDisciplines, SemesterEnrollment, Provider,
  CourseProvider, Studyright, StudyrightExtent,
  ElementDetails, StudyrightElement, Transfers
} = require('../models/index')
const { updateAttainmentDates } = require('./update_attainment_dates')

const updateStudent = async (student) => {
  const { studentInfo, studyAttainments, semesterEnrollments, studyRights } = student
  const transaction = await sequelize.transaction()
  try {
    await Student.upsert(studentInfo, { transaction })
    await Promise.all(semesterEnrollments.map(SE => SemesterEnrollment.upsert(SE, { transaction })))
    await Promise.all(studyAttainments.map(async ({ credit, creditTeachers, teachers, course }) => Promise.all([
      Course.upsert(course, { transaction }),
      Promise.all(course.disciplines.map(async courseDiscipline => { CourseDisciplines.upsert(courseDiscipline, { transaction }) })),
      Promise.all(course.providers.map(provider => Provider.upsert(provider, { transaction }))),
      Promise.all(course.courseproviders.map(courseProvider => CourseProvider.upsert(courseProvider, { transaction }))),
      Credit.upsert(credit, { transaction }),
      Promise.all(teachers.map(teacher => Teacher.upsert(teacher, { transaction }))),
      Promise.all(creditTeachers.map(cT => CreditTeacher.upsert(cT, { transaction })))
    ])))
    if (studyRights) {
      await Promise.all(studyRights.map(async ({ studyRightExtent, studyright, elementDetails, studyRightElements,transfers }) => Promise.all([
        StudyrightExtent.upsert(studyRightExtent, { transaction }),
        Studyright.upsert(studyright, { transaction }),
        Promise.all(elementDetails.map(elementdetails => ElementDetails.upsert(elementdetails, { transaction }))),
        Promise.all(studyRightElements.map(StudyRightElement => StudyrightElement.upsert(StudyRightElement, { transaction }))),
        Promise.all(transfers.map(transfer => Transfers.upsert(transfer, { transaction })))
      ])))
    }

    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    console.log(err)
  }
  await updateAttainmentDates()
}

const updateMeta = async ({
  faculties, courseRealisationsTypes,
  semesters, creditTypeCodes, courseTypeCodes,
  disciplines,
}) => {
  const transaction = await sequelize.transaction()

  try {
    await Promise.all([
      Promise.all(courseTypeCodes.map(_ =>
        CourseType.upsert(_, { transaction })
      )),
      Promise.all(faculties.map(_ =>
        Organisation.upsert(_, { transaction })
      )),
      Promise.all(courseRealisationsTypes.map(_ =>
        CourseRealisationType.upsert(_, { transaction })
      )),
      Promise.all(semesters.map(_ =>
        Semester.upsert(_, { transaction })
      )),
      Promise.all(creditTypeCodes.map(_ =>
        CreditType.upsert(_, { transaction })
      )),
      Promise.all(disciplines.map(_ =>
        Discipline.upsert(_, { transaction })
      )),
    ])
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    console.log(err)
  }

}
module.exports = {
  updateStudent, updateMeta
}