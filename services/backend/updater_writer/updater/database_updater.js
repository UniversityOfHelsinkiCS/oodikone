const { sequelize, } = require('../database/connection')
const { sortBy, flatMap } = require('lodash')

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
  // sort data to avoid deadlocks
  const courses = sortBy(studyAttainments.map(e => e.course), 'code')
  const disciplines = sortBy(flatMap(studyAttainments, e => e.course.disciplines || []), 'discipline_id', 'course_id')
  const providers = sortBy(flatMap(studyAttainments, e => e.course.providers), 'providercode')
  const courseproviders = sortBy(flatMap(studyAttainments, e => e.course.courseproviders), 'coursecode', 'providercode')
  const credits = sortBy(studyAttainments.map(e => e.credit), 'id')
  const teachers = sortBy(flatMap(studyAttainments, e => e.teachers || []), 'id')
  const creditTeachers = sortBy(flatMap(studyAttainments, e => e.creditTeachers), 'teacher_id', 'credit_id')

  for (const course of courses) {
    await Course.upsert(course, { transaction })
  }
  for (const courseDiscipline of disciplines) {
    await CourseDisciplines.upsert(courseDiscipline, { transaction })
  }
  for (const provider of providers) {
    await Provider.upsert(provider, { transaction })
  }
  // must be after providers inserted
  for (const courseProvider of courseproviders) {
    await CourseProvider.upsert(courseProvider, { transaction })
  }
  for (const credit of credits) {
    await Credit.upsert(credit, { transaction })
  }
  for (const teacher of teachers) {
    await Teacher.upsert(teacher, { transaction })
  }
  // must be after teachers inserted
  for (const creditTeacher of creditTeachers) {
    await CreditTeacher.upsert(creditTeacher, { transaction })
  }
}

const updateStudyRights = async (studyRights, transaction) => {
  // sort data to avoid deadlocks
  const studyRightExtents = sortBy(studyRights.map(e => e.studyRightExtent), 'extentcode')
  const studyrights = sortBy(studyRights.map(e => e.studyright), 'studyrightid')
  const elementDetails = sortBy(flatMap(studyRights, e => e.elementDetails), 'code')
  const studyRightElements = sortBy(flatMap(studyRights, e => e.studyRightElements), 'startdate', 'enddate', 'studyrightid', 'code')
  const transfers = sortBy(flatMap(studyRights, e => e.transfers), 'transferdate', 'studentnumber', 'studyrightid', 'sourcecode', 'targetcode')

  for (const studyRightExtent of studyRightExtents) {
    await StudyrightExtent.upsert(studyRightExtent, { transaction })
  }
  for (const studyright of studyrights) {
    await Studyright.create(studyright, { transaction })
  }
  for (const elementdetail of elementDetails) {
    await ElementDetails.upsert(elementdetail, { transaction })
  }
  for (const StudyRightElement of studyRightElements) {
    await StudyrightElement.create(StudyRightElement, { transaction })
  }
  for (const transfer of transfers) {
    await Transfers.upsert(transfer, { transaction })
  }
}

const deleteStudentStudyrights = async (studentnumber, transaction) => {
  await Studyright.destroy({ where: { student_studentnumber: studentnumber } }, { transaction })
  await StudyrightElement.destroy({ where: { studentnumber } }, { transaction })
}

const updateStudent = async (student) => {
  let { studentInfo, studyAttainments, semesterEnrollments, studyRights } = student
  console.log('starting', studentInfo.studentnumber)
  console.time(studentInfo.studentnumber)

  // sort data to avoid deadlocks
  semesterEnrollments = sortBy(semesterEnrollments, 'studentnumber', 'semestercode')

  const transaction = await sequelize.transaction()
  try {
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