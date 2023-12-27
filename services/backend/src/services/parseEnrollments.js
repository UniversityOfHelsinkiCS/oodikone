const crypto = require('crypto')
const { formatStudyrightElement } = require('./parseCredits')

const parseEnrollment = (enrollment, anonymizationSalt, studentNumberToSrElementsMap) => {
  const { studentnumber, semester, state, enrollment_date_time, course_code } = enrollment
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
      coursecode: course_code,
      state,
      enrollment_date_time,
      studentnumber: anonymizedStudentNumber,
      programmes: studyrightElements.map(formatStudyrightElement),
    }
  }

  return {
    yearcode,
    yearname,
    semestercode,
    semestername,
    coursecode: course_code,
    state,
    enrollment_date_time,
    studentnumber,
    programmes: studyrightElements.map(formatStudyrightElement),
  }
}

module.exports = { parseEnrollment }
