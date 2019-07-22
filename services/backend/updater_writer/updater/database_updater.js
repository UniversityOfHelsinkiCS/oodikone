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

const updateAttainments = (studyAttainments, transaction) => studyAttainments.map(async ({ credit, creditTeachers, teachers, course }) => {
  await Course.upsert(course, { transaction })
  await Credit.upsert(credit, { transaction })
  const { disciplines, providers, courseproviders } = course
  disciplines && disciplines.length > 0 && await Promise.all(disciplines.map(courseDiscipline => CourseDisciplines.upsert(courseDiscipline, { transaction })))
  providers.length > 0 && await Promise.all(providers.map(provider => Provider.upsert(provider, { transaction })))
  courseproviders.length > 0 && await Promise.all(courseproviders.map(courseProvider => CourseProvider.upsert(courseProvider, { transaction })))
  teachers && teachers.length > 0 && await Promise.all(teachers.map(teacher => Teacher.upsert(teacher, { transaction })))
  creditTeachers.length > 0 && await Promise.all(creditTeachers.map(cT => CreditTeacher.upsert(cT, { transaction })))
})

const updateStudyRights = (studyRights, transaction) => studyRights.map(async ({ studyRightExtent, studyright, elementDetails, studyRightElements, transfers }) => {
  await StudyrightExtent.upsert(studyRightExtent, { transaction })
  // this needs to be done because Oodi just deletes deprecated studyrights from students ( big yikes )
  await Studyright.destroy({
    where: {
      student_studentnumber: studentnumber
    }
  }, { transaction })
  await Studyright.create(studyright, { transaction })
  await Promise.all(elementDetails.map(elementdetails => ElementDetails.upsert(elementdetails, { transaction })))
  // this needs to be done because Oodi just deletes deprecated studyrights from students ( big yikes )
  await StudyrightElement.destroy({
    where: {
      studentnumber
    }
  }, { transaction })
  await Promise.all(studyRightElements.map(StudyRightElement => StudyrightElement.create(StudyRightElement, { transaction })))
  await Promise.all(transfers.map(transfer => Transfers.upsert(transfer, { transaction })))
})

const updateStudent = async (student, stan) => {
  const { studentInfo, studyAttainments, semesterEnrollments, studyRights } = student
  const transaction = await sequelize.transaction()
  try {
    console.time(studentInfo.studentnumber)
    await Student.upsert(studentInfo, { transaction })
    await Promise.all(semesterEnrollments.map(SE =>
      SemesterEnrollment.upsert(SE, { transaction })))

    if (studyAttainments) await updateAttainments(studyAttainments, transaction)

    if (studyRights) await updateStudyRights(studyRights, transaction)
    console.log("old transactions")
    console.timeEnd(studentInfo.studentnumber)
    console.time(studentInfo.studentnumber)
    await transaction.commit()
    console.log("old commit")
    console.timeEnd(studentInfo.studentnumber)
  } catch (err) {
    console.log('could not commit', err2)
    try {
      await transaction.rollback()
    } catch (err2) {
      console.log('could not rollback', err2)
    }
    if (err.parent.code === '25P02') {
      console.log('Transaction aborted')
    } else if (err.message === 'deadlock detected') {
      console.log(err)
      console.log('Deadlock suicide')
      stan.close()
      process.exit(1)
    } else {
      console.log(err.parent)
    }
  }
}
const updateAttainmentMeta = async () => {
  try {
    await updateAttainmentDates()
  } catch (err) {
    console.log('vitun vittu')
  }
}

const updateMeta = async ({
  faculties, courseRealisationsTypes,
  semesters, creditTypeCodes, courseTypeCodes,
  disciplines,
}) => {
  const transaction = await sequelize.transaction()

  try {
    await Promise.all(
      courseTypeCodes.map(cT => CourseType.upsert(cT, { transaction }))
    )
    await Promise.all(
      faculties.map(org => Organisation.upsert(org, { transaction }))
    )
    await Promise.all(
      courseRealisationsTypes.map(cR => CourseRealisationType.upsert(cR, { transaction }))
    )
    await Promise.all(
      semesters.map(s => Semester.upsert(s, { transaction }))
    )
    await Promise.all(
      creditTypeCodes.map(cTC => CreditType.upsert(cTC, { transaction }))
    )
    await Promise.all(
      disciplines.map(d => Discipline.upsert(d, { transaction }))
    )
    await transaction.commit()
  } catch (err) {
    console.log('could not commit', err)
    try {
      await transaction.rollback()
    } catch (err2) {
      console.log('could not rollback', err2)
    }
  }
}

module.exports = {
  updateStudent, updateMeta, updateAttainmentMeta
}