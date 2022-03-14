const crypto = require('crypto')
const { formatStudyrightElement } = require('./parseCredits')

const parseEnrollment = (enrollment, anonymizationSalt) => {
  const { student, semester, state, enrollment_date_time, course_code } = enrollment
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
      coursecode: course_code,
      state,
      enrollment_date_time,
      studentnumber: anonymizedStudentNumber,
      programmes: studyright_elements.map(formatStudyrightElement),
    }
  }

  return {
    student,
    yearcode,
    yearname,
    semestercode,
    semestername,
    coursecode: course_code,
    state,
    enrollment_date_time,
    studentnumber,
    programmes: studyright_elements.map(formatStudyrightElement),
  }
}

module.exports = { parseEnrollment }
