import { InferAttributes } from 'sequelize'

import { Credit, Student } from '../../models'

export const formatStudent = (student: Student) => {
  return {
    studentNumber: student.studentnumber,
    genderCode: student.gender_code,
    homeCountryEn: student.home_country_en,
    creditcount: student.creditcount,
    credits: student.credits,
  }
}

export const formatCredit = (credit: InferAttributes<Credit>) => {
  const code = credit.course_code.replace('AY', '')
  return {
    id: `${credit.student_studentnumber}-${code}`, // For getting unique credits for each course code and student number
    acualId: credit.id,
    studentNumber: credit.student_studentnumber,
    courseCode: code,
    credits: credit.credits,
    attainmentDate: credit.attainment_date,
    studyrightId: credit.studyright_id,
    semestercode: credit.semestercode,
  }
}
