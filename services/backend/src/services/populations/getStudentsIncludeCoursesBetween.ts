import moment from 'moment'
import { literal, Op, QueryTypes } from 'sequelize'

import { dbConnections } from '../../database/connection'
import {
  Course,
  Credit,
  ElementDetail,
  Enrollment,
  Student,
  Studyplan,
  Studyright,
  StudyrightElement,
  StudyrightExtent,
  Semester,
  SemesterEnrollment,
  Transfer,
} from '../../models'
import { Tag } from '../../models/kone/tag'
import { TagStudent } from '../../models/kone/tagStudent'
import { EnrollmentState, PriorityCode } from '../../types'

const { sequelize } = dbConnections

const getStudentTags = async (studyRights: string[], studentNumbers: string[]) => {
  return await TagStudent.findAll({
    attributes: ['tag_id', 'studentnumber'],
    include: [
      {
        model: Tag,
        attributes: ['tag_id', 'tagname', 'personal_user_id'],
        where: {
          studytrack: {
            [Op.in]: studyRights,
          },
        },
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })
}

const getCreditsOfStudent = async (
  studentNumbers: string[],
  studyRights: string[],
  attainmentDateFrom: string | moment.Moment,
  endDate: Date
) => {
  const studyPlans = await Studyplan.findAll({
    where: { studentnumber: studentNumbers },
    attributes: ['included_courses'],
    raw: true,
  })
  const studyPlanCourses = Array.from(new Set([...studyPlans.map(plan => plan.included_courses)].flat()))

  const creditsOfStudent = {
    [Op.or]: [
      {
        attainment_date: {
          [Op.between]: [attainmentDateFrom, endDate],
        },
      },
      {
        // takes into account possible progress tests taken earlier than the start date
        course_code: ['320001', 'MH30_001'].includes(studyRights[0])
          ? ['375063', '339101', ...studyPlanCourses]
          : studyPlanCourses,
      },
    ],
    student_studentnumber: {
      [Op.in]: studentNumbers,
    },
  }
  return creditsOfStudent
}

const getCourses = async (creditsOfStudent: any) => {
  return await Course.findAll({
    attributes: [literal('DISTINCT ON("code") code') as unknown as string, 'name'],
    include: [
      {
        model: Credit,
        attributes: [],
        where: creditsOfStudent,
      },
    ],
    raw: true,
  })
}

const getEnrollments = async (studentNumbers: string[], attainmentDateFrom: moment.Moment | string, endDate: Date) => {
  return await Enrollment.findAll({
    attributes: ['course_code', 'state', 'enrollment_date_time', 'studentnumber', 'semestercode', 'studyright_id'],
    where: {
      enrollment_date_time: {
        [Op.between]: [attainmentDateFrom, endDate],
      },
      studentnumber: {
        [Op.in]: studentNumbers,
      },
      state: [EnrollmentState.ENROLLED, EnrollmentState.CONFIRMED],
    },
    raw: true,
  })
}

const getStudents = async (studentNumbers: string[]) => {
  const students: Array<Student & { tags?: TagStudent[] }> = await Student.findAll({
    attributes: [
      'firstnames',
      'lastname',
      'studentnumber',
      'home_country_en',
      'home_country_fi',
      'home_country_sv',
      'dateofuniversityenrollment',
      'creditcount',
      'abbreviatedname',
      'email',
      'secondary_email',
      'phone_number',
      'updatedAt',
      'gender_code',
      'birthdate',
      'sis_person_id',
    ],
    include: [
      {
        model: Transfer,
        attributes: ['transferdate', 'sourcecode', 'targetcode'],
        separate: true,
      },
      {
        model: Studyright,
        attributes: [
          'studyrightid',
          'startdate',
          'enddate',
          'extentcode',
          'graduated',
          'active',
          'prioritycode',
          'faculty_code',
          'studystartdate',
          'admission_type',
          'cancelled',
          'is_ba_ma',
          'semester_enrollments',
          'actual_studyrightid',
        ],
        separate: true,
        include: [
          {
            model: StudyrightElement,
            required: true,
            attributes: ['id', 'startdate', 'enddate', 'studyrightid', 'code'],
            include: [
              {
                model: ElementDetail,
              },
            ],
          },
        ],
      },
      {
        model: SemesterEnrollment,
        attributes: ['enrollmenttype', 'semestercode', 'enrollment_date'],
        separate: true,
        include: [
          {
            model: Semester,
            attributes: [],
            required: true,
          },
        ],
      },
      {
        model: Studyplan,
        attributes: ['included_courses', 'programme_code', 'completed_credits', 'studyrightid', 'curriculum_period_id'],
        separate: true,
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })
  return students
}

const getCredits = async (creditsOfStudent: any) => {
  return await Credit.findAll({
    attributes: [
      'grade',
      'credits',
      'credittypecode',
      'attainment_date',
      'isStudyModule',
      'student_studentnumber',
      'course_code',
      'language',
      'studyright_id',
    ],
    where: creditsOfStudent,
    raw: true,
  })
}

const getExtents = async (studentNumbers: string[]) => {
  return await StudyrightExtent.findAll({
    attributes: [
      literal('DISTINCT ON("studyright_extent"."extentcode") "studyright_extent"."extentcode"') as unknown as string,
      'name',
    ],
    include: [
      {
        model: Studyright,
        attributes: [],
        required: true,
        where: {
          student_studentnumber: {
            [Op.in]: studentNumbers,
          },
          prioritycode: {
            [Op.not]: PriorityCode.OPTION,
          },
        },
      },
    ],
    raw: true,
  })
}

const getSemesters = async (studentNumbers: string[], startDate: string, endDate: Date) => {
  return await Semester.findAll({
    attributes: [
      literal('DISTINCT ON("semester"."semestercode") "semester"."semestercode"') as unknown as string,
      'name',
      'startdate',
      'enddate',
    ],
    include: {
      model: SemesterEnrollment,
      attributes: [],
      required: true,
      where: {
        studentnumber: {
          [Op.in]: studentNumbers,
        },
      },
    },
    where: {
      startdate: {
        [Op.between]: [startDate, endDate],
      },
    },
    raw: true,
  })
}

const getElementDetails = async (studentNumbers: string[]) => {
  const elementDetails: Array<Pick<ElementDetail, 'code' | 'name' | 'type'>> = await sequelize.query(
    `SELECT DISTINCT ON (code) code, name, type FROM element_details WHERE
      EXISTS (SELECT 1 FROM transfers WHERE studentnumber IN (:studentNumbers) AND (code = sourcecode OR code = targetcode)) OR
      EXISTS (SELECT 1 FROM studyright_elements WHERE studentnumber IN (:studentNumbers) AND element_details.code = studyright_elements.code)`,
    {
      replacements: { studentNumbers },
      type: QueryTypes.SELECT,
    }
  )
  return elementDetails
}

export const getStudentsIncludeCoursesBetween = async (
  studentNumbers: string[],
  startDate: string,
  endDate: Date,
  studyRights: string[],
  tag
) => {
  const studentTags = await getStudentTags(studyRights, studentNumbers)

  const { studentNumbersWithTag, studentNumberToTags } = studentTags.reduce(
    (acc, studentTag) => {
      acc.studentNumberToTags[studentTag.studentnumber] = acc.studentNumberToTags[studentTag.studentnumber] || []
      acc.studentNumberToTags[studentTag.studentnumber].push(studentTag)
      if (tag && studentTag.tag_id === tag.tag_id) {
        acc.studentNumbersWithTag.push(studentTag.studentnumber)
      }
      return acc
    },
    { studentNumbersWithTag: [] as string[], studentNumberToTags: {} as Record<string, TagStudent[]> }
  )

  if (tag) {
    studentNumbers = studentNumbersWithTag
  }

  if (studentNumbers.length === 0) {
    return { students: [], enrollments: [], credits: [], extents: [], semesters: [], elementDetails: [], courses: [] }
  }

  const attainmentDateFrom = tag ? moment(startDate).year(tag.year) : startDate

  const creditsOfStudent = await getCreditsOfStudent(studentNumbers, studyRights, attainmentDateFrom, endDate)

  const courses = await getCourses(creditsOfStudent)
  const enrollments = await getEnrollments(studentNumbers, attainmentDateFrom, endDate)
  const students = await getStudents(studentNumbers)
  const credits = await getCredits(creditsOfStudent)
  const extents = await getExtents(studentNumbers)
  const semesters = await getSemesters(studentNumbers, startDate, endDate)
  const elementDetails = await getElementDetails(studentNumbers)

  students.forEach(student => {
    student.tags = studentNumberToTags[student.studentnumber] || []
  })

  return { students, enrollments, credits, extents, semesters, elementDetails, courses }
}
