const crypto = require('crypto')
const { Credit } = require('../models')

const formatStudyrightElement = ({ code, element_detail, startdate, studyright: sr }) => {
  const studyright = sr.get({ plain: true })
  return {
    code,
    name: element_detail.name,
    startdate,
    faculty_code: studyright.faculty_code || null,
    organization: studyright.organization
      ? {
          name: studyright.organization.name,
          code: studyright.organization.code,
        }
      : null,
  }
}

const parseCredit = (credit, anonymizationSalt) => {
  const { student, semester, grade, course_code, credits, attainment_date } = credit
  const { studentnumber, studyright_elements } = student
  const { yearcode, yearname, semestercode, name: semestername } = semester

  if (anonymizationSalt) {
    const anonymizedStudentNumber = crypto
      .createHash('sha256')
      .update(`${studentnumber}${anonymizationSalt}`)
      .digest('hex')

    const anonymizedStudent = {
      studentnumber: anonymizedStudentNumber,
    }

    return {
      obfuscated: true,
      student: anonymizedStudent,
      yearcode,
      yearname,
      semestercode,
      semestername,
      attainment_date,
      coursecode: course_code,
      grade,
      passed: !Credit.failed(credit) || Credit.passed(credit) || Credit.improved(credit),
      studentnumber: anonymizedStudentNumber,
      programmes: studyright_elements.map(formatStudyrightElement),
      credits,
    }
  }

  return {
    student,
    yearcode,
    yearname,
    semestercode,
    semestername,
    attainment_date,
    coursecode: course_code,
    grade,
    passed: !Credit.failed(credit) || Credit.passed(credit) || Credit.improved(credit),
    studentnumber,
    programmes: studyright_elements.map(formatStudyrightElement),
    credits,
  }
}

module.exports = { parseCredit, formatStudyrightElement }
