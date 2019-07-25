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

const awaitforEach = async (arr, func) => {
  for (let i = 0; i < arr.length; ++i) {
    await func(arr[i], i, arr)
  }
}

const updateAttainments = async (studyAttainments, transaction) => {
  for (const { course } of studyAttainments) {
    await Course.upsert(course, { transaction })
  }
  for (const { course } of studyAttainments) {
    const { disciplines } = course
    disciplines && disciplines.length > 0 && await awaitforEach(disciplines, async courseDiscipline => await CourseDisciplines.upsert(courseDiscipline, { transaction }))
  }
  for (const { course } of studyAttainments) {
    const { providers } = course
    providers.length > 0 && await awaitforEach(providers, async provider => await Provider.upsert(provider, { transaction }))
  }
  for (const { course } of studyAttainments) {
    const { courseproviders } = course
    courseproviders.length > 0 && await awaitforEach(courseproviders, async courseProvider => await CourseProvider.upsert(courseProvider, { transaction }))
  }
  for (const { credit } of studyAttainments) {
    await Credit.upsert(credit, { transaction })
  }
  for (const { teachers } of studyAttainments) {
    teachers && teachers.length > 0 && await awaitforEach(teachers, async teacher => await Teacher.upsert(teacher, { transaction }))
  }
  // must be after teachers inserted
  for (const { creditTeachers } of studyAttainments) {
    creditTeachers.length > 0 && await awaitforEach(creditTeachers, async cT => await CreditTeacher.upsert(cT, { transaction }))
  }
}

const updateStudyRights = async (studyRights, transaction) => {
  for (const { studyRightExtent } of studyRights) {
    await StudyrightExtent.upsert(studyRightExtent, { transaction })
  }
  for (const { studyright } of studyRights) {
    await Studyright.create(studyright, { transaction })
  }
  for (const { elementDetails } of studyRights) {
    await awaitforEach(elementDetails, async elementdetails => await ElementDetails.upsert(elementdetails, { transaction }))
  }
  for (const { studyRightElements } of studyRights) {
    await awaitforEach(studyRightElements, async StudyRightElement => await StudyrightElement.create(StudyRightElement, { transaction }))
  }
  for (const { transfers } of studyRights) {
    await awaitforEach(transfers, async transfer => await Transfers.upsert(transfer, { transaction }))
  }
}

const deleteStudentStudyrights = async (studentnumber, transaction) => {
  await Studyright.destroy({ where: { student_studentnumber: studentnumber } }, { transaction })
  await StudyrightElement.destroy({ where: { studentnumber } }, { transaction })
}

const updateStudent = async (student) => {
  const { studentInfo, studyAttainments, semesterEnrollments, studyRights } = student
  const transaction = await sequelize.transaction()
  try {
    console.log('starting', studentInfo.studentnumber)
    console.time(studentInfo.studentnumber)
    await deleteStudentStudyrights(studentInfo.studentnumber, transaction) // this needs to be done because Oodi just deletes deprecated studyrights from students ( big yikes )

    await Student.upsert(studentInfo, { transaction })
    await awaitforEach(semesterEnrollments, async SE => await SemesterEnrollment.upsert(SE, { transaction }))

    if (studyAttainments) await updateAttainments(studyAttainments, transaction)

    if (studyRights) await updateStudyRights(studyRights, transaction)
    await transaction.commit()
    console.timeEnd(studentInfo.studentnumber)
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

const updateAttainmentMeta = async () => {
  await updateAttainmentDates()
}

const updateMeta = async ({
  faculties, courseRealisationsTypes,
  semesters, creditTypeCodes, courseTypeCodes,
  disciplines,
}) => {
  const transaction = await sequelize.transaction()

  try {
    await awaitforEach(courseTypeCodes, async cT => await CourseType.upsert(cT, { transaction }))
    await awaitforEach(faculties, async org => await Organisation.upsert(org, { transaction }))
    await awaitforEach(courseRealisationsTypes, async cR => await CourseRealisationType.upsert(cR, { transaction }))
    await awaitforEach(semesters, async s => await Semester.upsert(s, { transaction }))
    await awaitforEach(creditTypeCodes, async cTC => await CreditType.upsert(cTC, { transaction }))
    await awaitforEach(disciplines, async d => await Discipline.upsert(d, { transaction }))
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = {
  updateStudent, updateMeta, updateAttainmentMeta
}