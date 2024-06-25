const mapObject = (obj, schema) => {
  return Object.keys(schema).reduce((acc, key) => {
    acc[key] = obj[schema[key]]
    return acc
  }, {})
}

const mapCourseInfo = course =>
  mapObject(course, {
    label: 'code',
    name: 'name',
  })

const mapOpenCredits = credit =>
  mapObject(credit, {
    attainmentCourseCode: 'course_code',
    attainmentDate: 'attainment_date',
    attainmentGrade: 'grade',
    attainmentStudentNumber: 'student_studentnumber',
  })

const mapOpenEnrollments = enrollment =>
  mapObject(enrollment, {
    enrollmentCourseCode: 'course_code',
    enrollmentDateTime: 'enrollment_date_time',
    enrollmentStudentNumber: 'studentnumber',
  })

const mapStudentInfo = student =>
  mapObject(student, {
    studentNumber: 'studentnumber',
    email: 'email',
    secondaryEmail: 'secondary_email',
  })

module.exports = {
  mapCourseInfo,
  mapOpenCredits,
  mapOpenEnrollments,
  mapStudentInfo,
}
