import { col, fn, Op, where } from 'sequelize'

import { Course, Credit, Enrollment, Student, Studyplan } from '../models/index'
import { CreditTypeCode, EnrollmentState } from '../types'

type Courses = Array<Pick<Course, 'code' | 'name' | 'substitutions'>>

interface StudentCredit {
  date: Date
  courseCode: string
  creditType: CreditTypeCode
  substitution: string | null
}

interface StudentEnrollment {
  date: Date
  courseCode: string
  substitution: string | null
}

interface StudentInfo {
  firstnames: string
  lastname: string
  email: string
  sis_person_id: string
  coursesInStudyPlan: string[]
  secondaryEmail: string | null
  credits: StudentCredit[]
  enrollments: Record<string, StudentEnrollment>
}

type StudentCredits = Record<
  string,
  Omit<StudentInfo, 'credits' | 'enrollments'> & {
    credits: StudentCredit[]
    enrollments: StudentEnrollment[]
  }
>

interface FormattedStudent extends StudentInfo {
  studentNumber: string
  allEnrollments: StudentEnrollment[]
}

interface StudentWithStudyplanNested
  extends Pick<Student, 'studentnumber' | 'firstnames' | 'lastname' | 'email' | 'sis_person_id' | 'secondary_email'> {
  studyplans: { included_courses: string[] }[]
}

interface StudentWithCourses extends Omit<StudentWithStudyplanNested, 'studyplans'> {
  coursesInStudyPlan: string[]
}

const getCourses = async (courseCodes: string[]) => {
  const courses: Courses = (
    await Course.findAll({
      attributes: ['code', 'name', 'substitutions'],
      where: where(fn('LOWER', col('code')), {
        [Op.in]: courseCodes.map(code => code.toLowerCase()),
      }),
    })
  ).map(course => course.toJSON())
  return courses
}

const getCredits = async (
  courses: Courses,
  fullCourseCodes: string[],
  courseCodes: string[],
  studentNumbers: string[]
) => {
  const credits: Array<Pick<Credit, 'course_code' | 'student_studentnumber' | 'credittypecode' | 'attainment_date'>> =
    await Credit.findAll({
      attributes: ['course_code', 'student_studentnumber', 'credittypecode', 'attainment_date'],
      where: {
        course_code: {
          [Op.in]: fullCourseCodes,
        },
        student_studentnumber: {
          [Op.in]: studentNumbers,
        },
      },
    })
  const formattedCredits = credits.map(credit => {
    const originalCode = courseCodes.includes(credit.course_code)
      ? null
      : courses.find(course => course.substitutions.includes(credit.course_code))?.code
    return {
      courseCode: originalCode ?? credit.course_code,
      substitution: originalCode ? credit.course_code : null,
      studentNumber: credit.student_studentnumber,
      creditType: credit.credittypecode,
      date: credit.attainment_date,
    }
  })
  return formattedCredits
}

const getEnrollments = async (courses: Courses, fullCourseCodes: string[], studentNumbers: string[]) => {
  const enrollments: Array<Pick<Enrollment, 'course_code' | 'enrollment_date_time' | 'studentnumber'>> =
    await Enrollment.findAll({
      attributes: ['course_code', 'enrollment_date_time', 'studentnumber'],
      where: {
        course_code: {
          [Op.in]: fullCourseCodes,
        },
        studentnumber: {
          [Op.in]: studentNumbers,
        },
        state: {
          [Op.eq]: EnrollmentState.ENROLLED,
        },
      },
    })
  const formattedEnrollments = enrollments.map(enrollment => {
    const originalCode = courses.find(course => course.substitutions.includes(enrollment.course_code))?.code
    return {
      courseCode: originalCode ?? enrollment.course_code,
      substitution: originalCode ? enrollment.course_code : null,
      studentNumber: enrollment.studentnumber,
      date: enrollment.enrollment_date_time,
    }
  })
  return formattedEnrollments
}

const getStudents = async (studentNumbers: string[]) => {
  const students = await Student.findAll({
    attributes: ['studentnumber', 'firstnames', 'lastname', 'email', 'sis_person_id', 'secondary_email'],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
    include: [
      {
        model: Studyplan,
        as: 'studyplans',
        attributes: ['included_courses'],
      },
    ],
  })

  return students.map(student => {
    const { studyplans, ...rest } = student.toJSON() as StudentWithStudyplanNested
    const coursesInStudyPlan = studyplans.flatMap(studyplan => studyplan.included_courses)
    return { ...rest, coursesInStudyPlan } as StudentWithCourses
  })
}

export const getCompletedCourses = async (studentNumbers: string[], courseCodes: string[]) => {
  const courses = await getCourses(courseCodes)
  const courseCodesSet = new Set(courseCodes)
  courses.forEach(course => {
    courseCodesSet.add(course.code)
    course.substitutions.forEach(substitution => {
      courseCodesSet.add(substitution)
    })
  })
  const fullCourseCodes = Array.from(courseCodesSet)

  const credits = await getCredits(courses, fullCourseCodes, courseCodes, studentNumbers)
  const enrollments = await getEnrollments(courses, fullCourseCodes, studentNumbers)
  const studentInfo = await getStudents(studentNumbers)

  const studentCredits: StudentCredits = {}
  studentInfo.forEach(student => {
    studentCredits[student.studentnumber] = {
      firstnames: student.firstnames,
      lastname: student.lastname,
      email: student.email,
      sis_person_id: student.sis_person_id,
      secondaryEmail: student.secondary_email,
      coursesInStudyPlan: student.coursesInStudyPlan,
      credits: [],
      enrollments: [],
    }
  })

  credits.forEach(credit => {
    if (credit.creditType === CreditTypeCode.FAILED) {
      return
    }
    const previous = studentCredits[credit.studentNumber].credits.find(
      studentCredit => credit.courseCode === studentCredit.courseCode
    )
    if (previous && previous.date > credit.date) {
      return
    }
    if (previous) {
      studentCredits[credit.studentNumber].credits = studentCredits[credit.studentNumber].credits.filter(
        studentCredit => credit.courseCode !== studentCredit.courseCode
      )
    }
    studentCredits[credit.studentNumber].credits.push({
      date: credit.date,
      courseCode: credit.courseCode,
      creditType: credit.creditType,
      substitution: credit.substitution,
    })
  })

  enrollments.forEach(enrollment => {
    if (
      credits.find(
        credit => credit.courseCode === enrollment.courseCode && credit.studentNumber === enrollment.studentNumber
      )
    ) {
      return
    }
    studentCredits[enrollment.studentNumber].enrollments.push({
      date: enrollment.date,
      courseCode: enrollment.courseCode,
      substitution: enrollment.substitution,
    })
  })

  const students = Object.keys(studentCredits).reduce((acc: FormattedStudent[], studentNumber) => {
    const student = studentCredits[studentNumber]
    acc.push({
      studentNumber,
      sis_person_id: student.sis_person_id,
      credits: student.credits,
      enrollments: {},
      allEnrollments: student.enrollments,
      firstnames: student.firstnames,
      lastname: student.lastname,
      email: student.email,
      secondaryEmail: student.secondaryEmail,
      coursesInStudyPlan: student.coursesInStudyPlan,
    })
    return acc
  }, [] as FormattedStudent[])

  students.forEach(student => {
    courseCodes.forEach(courseCode => {
      const [latestEnrollment] = student.allEnrollments
        .filter(enrollment => enrollment.courseCode === courseCode || enrollment.substitution === courseCode)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      student.enrollments[courseCode] = latestEnrollment
    })
  })

  // Omit allEnrollments, we're only supposed to show the recent, relevant enrollment,
  // the user does not have rights to see all enrollments.
  return {
    students: students.map(({ allEnrollments, ...rest }) => rest),
    courses,
  }
}
