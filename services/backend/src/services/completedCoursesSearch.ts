import { col, fn, Op, where } from 'sequelize'

import {
  CompletedCoursesCourse,
  CompletedCoursesStudent,
  CreditTypeCode,
  EnrollmentState,
  StudentCredits,
} from '@oodikone/shared/types'
import { omitKeys } from '@oodikone/shared/util'
import { CourseModel, CreditModel, EnrollmentModel, StudentModel, StudyplanModel } from '../models'

type StudentWithStudyplanNested = Pick<
  StudentModel,
  'studentnumber' | 'firstnames' | 'lastname' | 'email' | 'sis_person_id' | 'secondary_email'
> & {
  studyplans: { included_courses: string[] }[]
}

type StudentWithCourses = Omit<StudentWithStudyplanNested, 'studyplans'> & {
  coursesInStudyPlan: string[]
}

const getCourses = async (courseCodes: string[]) => {
  const courses: CompletedCoursesCourse[] = (
    await CourseModel.findAll({
      attributes: ['code', 'name', 'substitution_groups'],
      where: where(fn('LOWER', col('code')), {
        [Op.in]: courseCodes.map(code => code.toLowerCase()),
      }),
    })
  ).map(course => course.toJSON())
  return courses
}

const getPassedCredits = async (
  courses: CompletedCoursesCourse[],
  fullCourseCodes: string[],
  studentNumbers: string[]
) => {
  const credits: Pick<CreditModel, 'course_code' | 'student_studentnumber' | 'credittypecode' | 'attainment_date'>[] =
    await CreditModel.findAll({
      raw: true,
      attributes: ['course_code', 'student_studentnumber', 'credittypecode', 'attainment_date'],
      order: [['attainment_date', 'DESC']],
      where: {
        course_code: {
          [Op.in]: fullCourseCodes,
        },
        student_studentnumber: {
          [Op.in]: studentNumbers,
        },
        credittypecode: {
          [Op.not]: CreditTypeCode.FAILED,
        },
      },
    })

  const creditsByStudentNumber = Object.groupBy(credits, ({ student_studentnumber }) => student_studentnumber)

  const formattedCredits: {
    courseCode: string
    substitution: string[] | null
    studentNumber: string
    creditType: CreditTypeCode
    date: Date
  }[] = []

  Object.entries(creditsByStudentNumber).map(([studentNumber, credits]) => {
    // We know that credits will exist, because of the way we created the previous object
    const studentCreditCourseCodes = credits!.map(({ course_code }) => course_code)
    for (const course of courses) {
      // Also handle the main course code by adding it as a group
      for (const group of [[course.code]].concat(course.substitution_groups)) {
        if (group.every(code => studentCreditCourseCodes.includes(code))) {
          // We just checked that (group) course code exists in credits so .find(...)! is ok
          const groupCredits = group.map(code => credits!.find(credit => credit.course_code === code)!)
          if (groupCredits.length) {
            const groupCreditCodes = groupCredits.map(({ course_code }) => course_code)
            formattedCredits.push({
              courseCode: course.code,
              substitution:
                groupCreditCodes.includes(course.code) && groupCreditCodes.length === 1 ? null : groupCreditCodes,
              studentNumber,
              creditType: groupCredits.length > 1 ? CreditTypeCode.PASSED : groupCredits.at(0)!.credittypecode,
              date: groupCredits?.at(0)?.attainment_date ?? new Date(), // Credits are sorted by date in desc. order
            })
          }
        }
      }
    }
  })

  return formattedCredits
}

const getEnrollments = async (
  courses: CompletedCoursesCourse[],
  fullCourseCodes: string[],
  studentNumbers: string[]
) => {
  const enrollments: Array<Pick<EnrollmentModel, 'course_code' | 'enrollment_date_time' | 'studentnumber'>> =
    await EnrollmentModel.findAll({
      attributes: ['course_code', 'enrollment_date_time', 'studentnumber'],
      order: [['enrollment_date_time', 'DESC']],
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

  const enrollmentsByStudents = Object.groupBy(enrollments, ({ studentnumber }) => studentnumber)

  const formattedEnrollments: {
    courseCode: string
    substitution: string[] | null
    studentNumber: string
    date: Date
  }[] = []

  Object.entries(enrollmentsByStudents).map(([studentNumber, enrollments]) => {
    // We know that enrollments will exist, because of the way we created the previous object
    const studentEnrollmentCourseCodes = enrollments!.map(({ course_code }) => course_code)
    for (const course of courses) {
      // Also handle the main course code by adding it as a group
      for (const group of [[course.code]].concat(course.substitution_groups)) {
        if (group.every(code => studentEnrollmentCourseCodes.includes(code))) {
          // We just checked that (group) course code exists in enrollments so .find(...)! is ok
          const groupEnrollments = group.map(code => enrollments!.find(enrollment => enrollment.course_code === code)!)
          if (groupEnrollments.length) {
            const groupEnrollmentCodes = groupEnrollments.map(({ course_code }) => course_code)
            formattedEnrollments.push({
              courseCode: course.code,
              substitution:
                groupEnrollmentCodes.includes(course.code) && groupEnrollmentCodes.length === 1
                  ? null
                  : groupEnrollmentCodes,
              studentNumber,
              date: groupEnrollments?.at(0)?.enrollment_date_time ?? new Date(), // Enrollments are sorted by date in desc. order
            })
          }
        }
      }
    }
  })

  return formattedEnrollments
}

const getStudents = async (studentNumbers: string[]): Promise<StudentWithCourses[]> => {
  const students = await StudentModel.findAll({
    attributes: ['studentnumber', 'firstnames', 'lastname', 'email', 'sis_person_id', 'secondary_email'],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
    include: [
      {
        model: StudyplanModel,
        as: 'studyplans',
        attributes: ['included_courses'],
      },
    ],
  })

  return students.map(student => {
    const { studyplans, ...rest }: StudentWithStudyplanNested = student.toJSON()
    const coursesInStudyPlan = studyplans.flatMap(studyplan => studyplan.included_courses)
    return { ...rest, coursesInStudyPlan }
  })
}

export const getCompletedCourses = async (
  studentNumbers: string[],
  courseCodes: string[]
): Promise<{ students: Omit<CompletedCoursesStudent, 'allEnrollments'>[]; courses: CompletedCoursesCourse[] }> => {
  const courses = await getCourses(courseCodes)
  const courseCodesSet = new Set(courseCodes)

  // Get *ALL* courses including any courses in any substitution groups
  for (const course of courses) {
    courseCodesSet.add(course.code)
    for (const group of course.substitution_groups) {
      for (const code of group) {
        courseCodesSet.add(code)
      }
    }
  }

  const fullCourseCodes = Array.from(courseCodesSet)

  const credits = await getPassedCredits(courses, fullCourseCodes, studentNumbers)
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

  const students = Object.keys(studentCredits).reduce<CompletedCoursesStudent[]>(
    (acc: CompletedCoursesStudent[], studentNumber) => {
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
    },
    []
  )

  students.forEach(student => {
    courseCodes.forEach(courseCode => {
      const [latestEnrollment] = student.allEnrollments
        .filter(enrollment => enrollment.courseCode === courseCode)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      student.enrollments[courseCode] = latestEnrollment
    })
  })

  // Omit allEnrollments, we're only supposed to show the recent, relevant enrollment,
  // the user does not have rights to see all enrollments.
  return {
    students: students.map(student => omitKeys(student, ['allEnrollments'])),
    courses,
  }
}
