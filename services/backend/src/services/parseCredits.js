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

const parseCredit = (credit, anonymizationSalt, studentNumberToSrElementsMap) => {
  const { semester, grade, course_code, credits, attainment_date, student_studentnumber: studentnumber } = credit
  const { yearcode, yearname, semestercode, name: semestername } = semester

  const studyrightElements = studentNumberToSrElementsMap[studentnumber] || []

  if (anonymizationSalt) {
    const anonymizedStudentNumber = crypto
      .createHash('sha256')
      .update(`${studentnumber}${anonymizationSalt}`)
      .digest('hex')

    return {
      obfuscated: true,
      yearcode,
      yearname,
      semestercode,
      semestername,
      attainment_date,
      coursecode: course_code,
      grade,
      passed: !Credit.failed(credit) || Credit.passed(credit) || Credit.improved(credit),
      studentnumber: anonymizedStudentNumber,
      programmes: studyrightElements.map(formatStudyrightElement),
      credits,
    }
  }

  return {
    yearcode,
    yearname,
    semestercode,
    semestername,
    attainment_date,
    coursecode: course_code,
    grade,
    passed: !Credit.failed(credit) || Credit.passed(credit) || Credit.improved(credit),
    studentnumber,
    programmes: studyrightElements.map(formatStudyrightElement),
    credits,
  }
}

module.exports = { parseCredit, formatStudyrightElement }
