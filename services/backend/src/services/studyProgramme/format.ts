import { Credit } from '@oodikone/shared/models'

export const formatCredit = (credit: Credit) => {
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
