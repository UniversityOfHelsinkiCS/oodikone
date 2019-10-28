const { sequelize } = require('../database/connection')
const { sortBy, flatMap, uniqBy, sortedUniqBy } = require('lodash')

const {
  Student,
  Credit,
  Course,
  CreditTeacher,
  Teacher,
  Organisation,
  CourseRealisationType,
  Semester,
  CreditType,
  CourseType,
  Discipline,
  CourseDisciplines,
  SemesterEnrollment,
  Provider,
  CourseProvider,
  Studyright,
  StudyrightExtent,
  ElementDetails,
  StudyrightElement,
  Transfers
} = require('../models/index')
const { updateAttainmentDates } = require('./update_attainment_dates')

const getColumnsToUpdate = arr => (arr[0] ? Object.keys(arr[0]) : [])

const updateAttainments = async (studyAttainments, transaction) => {
  // Sort data to avoid deadlocks. If there are duplicate primary keys in the same array, then bulkCreate won't work.
  const courses = sortedUniqBy(sortBy(studyAttainments.map(e => e.course), 'code'), 'code')
  const disciplines = sortBy(flatMap(studyAttainments, e => e.course.disciplines || []), 'discipline_id', 'course_id')
  const providers = sortedUniqBy(
    sortBy(flatMap(studyAttainments, e => e.course.providers), 'providercode'),
    'providercode'
  )
  const courseproviders = sortBy(flatMap(studyAttainments, e => e.course.courseproviders), 'coursecode', 'providercode')
  const credits = sortedUniqBy(sortBy(studyAttainments.map(e => e.credit), 'id'), 'id')
  const teachers = sortedUniqBy(sortBy(flatMap(studyAttainments, e => e.teachers || []), 'id'), 'id')
  const creditTeachers = sortBy(flatMap(studyAttainments, e => e.creditTeachers), 'teacher_id', 'credit_id')

  await Promise.all([
    Course.bulkCreate(courses, {
      transaction,
      updateOnDuplicate: getColumnsToUpdate(courses)
    }),
    Provider.bulkCreate(providers, {
      transaction,
      updateOnDuplicate: getColumnsToUpdate(providers)
    }),
    Credit.bulkCreate(credits, {
      transaction,
      updateOnDuplicate: getColumnsToUpdate(credits)
    }),
    Teacher.bulkCreate(teachers, {
      transaction,
      updateOnDuplicate: getColumnsToUpdate(teachers)
    })
  ])

  await Promise.all([
    // must be after courses
    CourseDisciplines.bulkCreate(disciplines, {
      transaction,
      ignoreDuplicates: true
    }),
    // must be after providers
    CourseProvider.bulkCreate(courseproviders, {
      transaction,
      ignoreDuplicates: true
    }),
    // must be after teachers
    CreditTeacher.bulkCreate(creditTeachers, {
      transaction,
      ignoreDuplicates: true
    })
  ])
}

const updateStudyRights = async (studyRights, transaction) => {
  // Sort data to avoid deadlocks. If there are duplicate primary keys in the same array, then bulkCreate won't work.
  const studyRightExtents = sortedUniqBy(sortBy(studyRights.map(e => e.studyRightExtent), 'extentcode'), 'extentcode')
  const studyrights = sortedUniqBy(sortBy(studyRights.map(e => e.studyright), 'studyrightid'), 'studyrightid')
  const elementDetails = sortedUniqBy(sortBy(flatMap(studyRights, e => e.elementDetails), 'code'), 'code')
  const studyRightElements = uniqBy(
    sortBy(flatMap(studyRights, e => e.studyRightElements), 'startdate', 'enddate', 'studyrightid', 'code'),
    s => `${s.startdate}${s.enddate}${s.studyrightid}${s.code}`
  )
  const transfers = sortBy(
    flatMap(studyRights, e => e.transfers),
    'transferdate',
    'studentnumber',
    'studyrightid',
    'sourcecode',
    'targetcode'
  )

  await Promise.all([
    StudyrightExtent.bulkCreate(studyRightExtents, {
      transaction,
      updateOnDuplicate: getColumnsToUpdate(studyRightExtents)
    }),

    Studyright.bulkCreate(studyrights, {
      transaction,
      updateOnDuplicate: getColumnsToUpdate(studyrights)
    }),

    ElementDetails.bulkCreate(elementDetails, {
      transaction,
      updateOnDuplicate: getColumnsToUpdate(elementDetails)
    }),

    StudyrightElement.bulkCreate(studyRightElements, {
      transaction,
      updateOnDuplicate: getColumnsToUpdate(studyRightElements)
    }),

    Transfers.bulkCreate(transfers, {
      transaction,
      updateOnDuplicate: getColumnsToUpdate(transfers)
    })
  ])
}

const deleteStudentStudyrights = async (studentnumber, transaction) => {
  await Studyright.destroy({ where: { student_studentnumber: studentnumber } }, { transaction })
  await StudyrightElement.destroy({ where: { studentnumber } }, { transaction })
}

const updateStudent = async student => {
  let { studentInfo, studyAttainments, semesterEnrollments, studyRights } = student

  // sort data to avoid deadlocks
  semesterEnrollments = uniqBy(
    sortBy(semesterEnrollments, 'studentnumber', 'semestercode'),
    sE => `${sE.semestercode}${sE.studentnumber}`
  )

  const transaction = await sequelize.transaction()
  try {
    await deleteStudentStudyrights(studentInfo.studentnumber, transaction) // this needs to be done because Oodi just deletes deprecated studyrights from students ( big yikes )

    await Student.upsert(studentInfo, { transaction })

    // Change this to bulkCreate after https://github.com/sequelize/sequelize/issues/11569
    // is merged and released
    for (let i = 0; i < semesterEnrollments.length; i++) {
      await SemesterEnrollment.upsert(semesterEnrollments[i], { transaction })
    }

    if (studyAttainments) await updateAttainments(studyAttainments, transaction)

    if (studyRights) await updateStudyRights(studyRights, transaction)
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

const updateAttainmentMeta = async () => {
  await updateAttainmentDates()
}

const updateMeta = async ({
  faculties,
  courseRealisationsTypes,
  semesters,
  creditTypeCodes,
  courseTypeCodes,
  disciplines
}) => {
  const transaction = await sequelize.transaction()

  try {
    await Promise.all([
      CourseType.bulkCreate(uniqBy(courseTypeCodes, 'coursetypecode'), {
        transaction,
        updateOnDuplicate: getColumnsToUpdate(courseTypeCodes)
      }),
      Organisation.bulkCreate(uniqBy(faculties, 'code'), {
        transaction,
        updateOnDuplicate: getColumnsToUpdate(faculties)
      }),
      CourseRealisationType.bulkCreate(uniqBy(courseRealisationsTypes, 'realisationtypecode'), {
        transaction,
        updateOnDuplicate: getColumnsToUpdate(courseRealisationsTypes)
      }),
      Semester.bulkCreate(uniqBy(semesters, 'semestercode'), {
        transaction,
        updateOnDuplicate: getColumnsToUpdate(semesters)
      }),
      CreditType.bulkCreate(uniqBy(creditTypeCodes, 'credittypecode'), {
        transaction,
        updateOnDuplicate: getColumnsToUpdate(creditTypeCodes)
      }),
      Discipline.bulkCreate(uniqBy(disciplines, 'discipline_id'), {
        transaction,
        updateOnDuplicate: getColumnsToUpdate(disciplines)
      })
    ])

    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = {
  updateStudent,
  updateMeta,
  updateAttainmentMeta
}
