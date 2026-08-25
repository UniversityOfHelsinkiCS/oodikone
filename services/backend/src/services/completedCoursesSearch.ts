import { col, fn, Op, where } from 'sequelize'

import {
  CompletedCoursesCourse,
  CompletedCoursesStudent,
  CreditTypeCode,
  EnrollmentState,
  StudentCredits,
} from '@oodikone/shared/types'
import { enrollmentTimeDateThreshold, omitKeys } from '@oodikone/shared/util'
import { CourseModel, CreditModel, EnrollmentModel, StudentModel, StudyplanModel } from '../models'
import { now } from '../util/clock'

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
  if (courseCodes.length === 0) return []

  const matchedCourses: Pick<CourseModel, 'groupId'>[] = await CourseModel.findAll({
    attributes: ['groupId'],
    where: where(fn('LOWER', col('code')), {
      [Op.in]: courseCodes.map(code => code.toLowerCase()),
    }),
    raw: true,
  })
  const groupIds = [...new Set(matchedCourses.map(({ groupId }) => groupId))]
  if (groupIds.length === 0) return []

  const courses: CompletedCoursesCourse[] = await CourseModel.findAll({
    attributes: ['code', 'name', 'groupId', 'substitutionGroups'],
    where: { groupId: { [Op.in]: groupIds }, isPrimary: true },
    raw: true,
  })
  return courses
}

// Every course-position a student must hold a credit/enrollment for, in order to satisfy a substitution
// combination: the main course's own groupId, plus each substitution group's member groupIds.
const getGroupIdCombinationsFor = (course: CompletedCoursesCourse): string[][] => [
  [course.groupId],
  ...(course.substitutionGroups ?? []),
]

const getPassedCredits = async (
  courses: CompletedCoursesCourse[],
  courseIds: string[],
  studentNumbers: string[],
  idToGroupId: Record<string, string>
) => {
  const credits: Pick<
    CreditModel,
    'course_code' | 'course_id' | 'student_studentnumber' | 'credittypecode' | 'attainment_date'
  >[] = await CreditModel.findAll({
    raw: true,
    attributes: ['course_code', 'course_id', 'student_studentnumber', 'credittypecode', 'attainment_date'],
    order: [['attainment_date', 'DESC']],
    where: {
      course_id: {
        [Op.in]: courseIds,
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
    const studentCreditGroupIds = credits!.map(credit => idToGroupId[credit.course_id])
    for (const course of courses) {
      // The first combination is always the main course itself; the rest are substitution groups
      getGroupIdCombinationsFor(course).forEach((positions, index) => {
        const isMainCourse = index === 0
        if (positions.every(groupId => studentCreditGroupIds.includes(groupId))) {
          // We just checked that each position has a matching credit so .find(...)! is ok
          const groupCredits = positions.map(
            groupId => credits!.find(credit => idToGroupId[credit.course_id] === groupId)!
          )
          if (groupCredits.length) {
            const groupCreditCodes = groupCredits.map(({ course_code }) => course_code)
            formattedCredits.push({
              courseCode: course.code,
              substitution: isMainCourse ? null : groupCreditCodes,
              studentNumber,
              creditType: groupCredits.length > 1 ? CreditTypeCode.PASSED : groupCredits.at(0)!.credittypecode,
              date: groupCredits?.at(0)?.attainment_date ?? now(), // Credits are sorted by date in desc. order
            })
          }
        }
      })
    }
  })

  return formattedCredits
}

const getEnrollments = async (
  courses: CompletedCoursesCourse[],
  courseIds: string[],
  studentNumbers: string[],
  idToGroupId: Record<string, string>
) => {
  const enrollments: Array<
    Pick<EnrollmentModel, 'course_code' | 'course_id' | 'enrollment_date_time' | 'studentnumber'>
  > = await EnrollmentModel.findAll({
    attributes: ['course_code', 'course_id', 'enrollment_date_time', 'studentnumber'],
    order: [['enrollment_date_time', 'DESC']],
    where: {
      course_id: {
        [Op.in]: courseIds,
      },
      studentnumber: {
        [Op.in]: studentNumbers,
      },
      state: {
        [Op.eq]: EnrollmentState.ENROLLED,
      },
      enrollment_date_time: { [Op.gte]: enrollmentTimeDateThreshold },
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
    const studentEnrollmentGroupIds = enrollments!.map(enrollment => idToGroupId[enrollment.course_id])
    for (const course of courses) {
      // The first combination is always the main course itself; the rest are substitution groups
      getGroupIdCombinationsFor(course).forEach((positions, index) => {
        const isMainCourse = index === 0
        if (positions.every(groupId => studentEnrollmentGroupIds.includes(groupId))) {
          // We just checked that each position has a matching enrollment so .find(...)! is ok
          const groupEnrollments = positions.map(
            groupId => enrollments!.find(enrollment => idToGroupId[enrollment.course_id] === groupId)!
          )
          if (groupEnrollments.length) {
            const groupEnrollmentCodes = groupEnrollments.map(({ course_code }) => course_code)
            formattedEnrollments.push({
              courseCode: course.code,
              substitution: isMainCourse ? null : groupEnrollmentCodes,
              studentNumber,
              date: groupEnrollments?.at(0)?.enrollment_date_time ?? now(), // Enrollments are sorted by date in desc. order
            })
          }
        }
      })
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

  const plainStudents = students.map((student): StudentWithStudyplanNested => student.toJSON())

  // included_courses holds course ids, with a rare fallback to a raw code for "custom" (non-catalogued)
  // entries. Resolve ids to their current code for display - anything missing from the map is already a code.
  const includedCourseIds = [
    ...new Set(
      plainStudents.flatMap(student => student.studyplans.flatMap(({ included_courses }) => included_courses))
    ),
  ]
  const courses: Pick<CourseModel, 'id' | 'code'>[] = await CourseModel.findAll({
    attributes: ['id', 'code'],
    where: { id: { [Op.in]: includedCourseIds } },
    raw: true,
  })
  const idToCode = Object.fromEntries(courses.map(({ id, code }) => [id, code]))

  return plainStudents.map(({ studyplans, ...rest }) => {
    const coursesInStudyPlan = studyplans.flatMap(studyplan =>
      studyplan.included_courses.map(idOrCode => idToCode[idOrCode] ?? idOrCode)
    )
    return { ...rest, coursesInStudyPlan }
  })
}

export const getCompletedCourses = async (
  studentNumbers: string[],
  courseCodes: string[]
): Promise<{ students: Omit<CompletedCoursesStudent, 'allEnrollments'>[]; courses: CompletedCoursesCourse[] }> => {
  const courses = await getCourses(courseCodes)

  // Get *ALL* courses' ids, including any courses in any substitution groups
  const substitutionGroupIds = courses.flatMap(course => (course.substitutionGroups ?? []).flat())
  const allGroupIds = [...new Set([...courses.map(course => course.groupId), ...substitutionGroupIds])]

  const relevantCourses: Pick<CourseModel, 'id' | 'groupId'>[] = await CourseModel.findAll({
    attributes: ['id', 'groupId'],
    where: { groupId: { [Op.in]: allGroupIds } },
    raw: true,
  })
  const courseIds = relevantCourses.map(({ id }) => id)
  const idToGroupId = Object.fromEntries(relevantCourses.map(({ id, groupId }) => [id, groupId]))

  const credits = await getPassedCredits(courses, courseIds, studentNumbers, idToGroupId)
  const enrollments = await getEnrollments(courses, courseIds, studentNumbers, idToGroupId)
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
    courses.forEach(({ code: courseCode }) => {
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
