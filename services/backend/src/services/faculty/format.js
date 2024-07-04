const { mapObject } = require('../../util/map')

const formatFacultyStudyRight = studyRight => {
  return {
    id: studyRight.id,
    startDate: studyRight.startDate,
    endDate: studyRight.endDate,
    studyStartDate: studyRight.studyStartDate,
    cancelled: studyRight.cancelled,
    studentNumber: studyRight.studentNumber,
    extentCode: studyRight.extentCode,
    admissionType: studyRight.admissionType,
    semesterEnrollments: studyRight.semesterEnrollments,
    facultyCode: studyRight.facultyCode,
    studyRightElements: studyRight.studyRightElements.map(studyRightElement => studyRightElement.toJSON()),
  }
}

const formatFacultyProgrammeStudents = student => {
  const { studentnumber, home_country_en, gender_code, semester_enrollments } = student
  return {
    stundetNumber: studentnumber,
    homeCountryEn: home_country_en,
    genderCode: gender_code,
    semesters: semester_enrollments.map(enrollment => enrollment.dataValues),
  }
}
const formatFacultyTransfer = transfer => {
  return mapObject(transfer, {
    sourceCode: 'sourcecode',
    targetCode: 'targetcode',
    transferDate: 'transferdate',
    studyRightId: 'studyrightid',
    studentNumber: 'studentnumber',
  })
}

const formatFacultyProgramme = programme => {
  return mapObject(programme, {
    code: 'code',
    name: 'name',
  })
}

const formatFacultyThesisWriter = credit => {
  return mapObject(credit, {
    course_code: 'course_code',
    credits: 'credits',
    attainment_date: 'attainment_date',
    student_studentnumber: 'student_studentnumber',
    courseUnitType: 'course.course_unit_type',
  })
}

const formatOrganization = org => {
  const { id, name, code, parent_id } = org
  return { id, name, code, parentId: parent_id }
}

module.exports = {
  formatFacultyProgramme,
  formatFacultyProgrammeStudents,
  formatFacultyStudyRight,
  formatFacultyTransfer,
  formatFacultyThesisWriter,
  formatOrganization,
}
