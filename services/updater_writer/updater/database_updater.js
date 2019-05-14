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

const deleteStudentStudyrights = async (studentnumber, transaction) => {
  await Studyright.destroy({
    where: {
      student_studentnumber: studentnumber
    }
  }, { transaction })
  await StudyrightElement.destroy({
    where: {
      studentnumber
    }
  }, { transaction })
}

const updateAttainments = (studyAttainments, transaction) => studyAttainments.map(async ({ credit, creditTeachers, teachers, course }) => {
  await Promise.all([
    await Course.upsert(course, { transaction }),
    await Credit.upsert(credit, { transaction }),
  ])
  await Promise.all([
    Promise.all(course.disciplines.map(courseDiscipline => { CourseDisciplines.upsert(courseDiscipline, { transaction }) })),
    Promise.all(course.providers.map(provider => Provider.upsert(provider, { transaction }))),
    Promise.all(course.courseproviders.map(courseProvider => CourseProvider.upsert(courseProvider, { transaction }))),
    teachers && Promise.all(teachers.map(teacher => Teacher.upsert(teacher, { transaction }))),
    Promise.all(creditTeachers.map(cT => CreditTeacher.upsert(cT, { transaction })))
  ])
})

const updateStudyRights = (studyRights, transaction) => studyRights.map(async ({ studyRightExtent, studyright, elementDetails, studyRightElements, transfers }) => {
  await Promise.all([
    StudyrightExtent.upsert(studyRightExtent, { transaction }),
    Studyright.create(studyright, { transaction })
  ])
  await Promise.all([
    Promise.all(elementDetails.map(elementdetails => ElementDetails.upsert(elementdetails, { transaction }))),
    Promise.all(studyRightElements.map(StudyRightElement => StudyrightElement.create(StudyRightElement, { transaction }))),
    Promise.all(transfers.map(transfer => Transfers.upsert(transfer, { transaction })))
  ])
})

const updateStudent = async (student) => {
  const { studentInfo, studyAttainments, semesterEnrollments, studyRights } = student
  const transaction = await sequelize.transaction()
  try {
    await deleteStudentStudyrights(studentInfo.studentnumber, transaction) // this needs to be done because Oodi just deletes deprecated studyrights from students ( big yikes )

    await Student.upsert(studentInfo, { transaction })
    await Promise.all(semesterEnrollments.map(SE => SemesterEnrollment.upsert(SE, { transaction })))
    await Promise.all(updateAttainments(studyAttainments, transaction))

    if (studyRights) await Promise.all(updateStudyRights(studyRights, transaction))

    await transaction.commit()
  } catch (err) {
    console.log(err)
    await transaction.rollback()
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