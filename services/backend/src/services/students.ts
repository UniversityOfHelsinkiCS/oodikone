import { Op, QueryTypes } from 'sequelize'

import { dbConnections } from '../database/connection'
import {
  Student,
  Credit,
  Course,
  ElementDetail,
  SemesterEnrollment,
  Semester,
  Studyplan,
  SISStudyRight,
  SISStudyRightElement,
} from '../models'
import { Tag, TagStudent } from '../models/kone'
import { Name } from '../types'
import { splitByEmptySpace } from '../util'
import logger from '../util/logger'

const { sequelize } = dbConnections

type SemesterEnrollmentWithNameAndYear = SemesterEnrollment & {
  name?: Name
  yearname?: string
  startYear?: number
}

const byStudentNumber = async (studentNumber: string) => {
  const [student, tags] = await Promise.all([
    Student.findByPk(studentNumber, {
      attributes: [
        'firstnames',
        'lastname',
        'studentnumber',
        'dateofuniversityenrollment',
        'creditcount',
        'creditcount',
        'abbreviatedname',
        'email',
        'updatedAt',
        'createdAt',
        'sis_person_id',
      ],
      include: [
        {
          model: Credit,
          attributes: ['grade', 'credits', 'credittypecode', 'is_open', 'attainment_date', 'isStudyModule'],
          separate: true,
          include: [
            {
              model: Course,
              attributes: ['code', 'name'],
              required: true,
            },
          ],
        },
        {
          model: SISStudyRight,
          as: 'studyRights',
          include: [
            {
              required: true,
              model: SISStudyRightElement,
              as: 'studyRightElements',
            },
          ],
        },
        {
          model: SemesterEnrollment,
        },
        {
          model: Studyplan,
          attributes: ['id', 'included_courses', 'programme_code', 'completed_credits', 'sis_study_right_id'],
        },
      ],
      order: [
        [
          { model: SISStudyRight, as: 'studyRights' },
          { model: SISStudyRightElement, as: 'studyRightElements' },
          'endDate',
          'desc',
        ],
      ],
    }),
    TagStudent.findAll({
      include: {
        model: Tag,
      },
      where: {
        studentnumber: studentNumber,
      },
    }),
  ])
  if (!student) return null
  const tagprogrammes = await ElementDetail.findAll({
    where: {
      code: {
        [Op.in]: tags.map(t => t.tag.studytrack),
      },
    },
  })
  const semesters = await Semester.findAll()
  const mappedEnrollments = student.semester_enrollments.map(enrollment => {
    const semester = semesters.find(semester => semester.semestercode === enrollment.semestercode)!
    return {
      ...(enrollment.dataValues as SemesterEnrollment),
      name: semester.name,
      yearname: semester.yearname,
      startYear: semester.startYear,
    }
  })
  student.semester_enrollments = mappedEnrollments as Array<SemesterEnrollmentWithNameAndYear>

  return {
    ...(student.dataValues as Student),
    tags: tags.map(tag => ({
      ...tag.get(),
      programme: tagprogrammes.find(programme => programme.code === tag.tag.studytrack),
    })),
  }
}

export type UnifyStatus = 'unifyStats' | 'openStats' | 'regularStats' | undefined

const getUnifyStatus = (unifyCourses: UnifyStatus): [boolean] | [boolean, false] => {
  switch (unifyCourses) {
    case 'unifyStats':
      return [true, false]
    case 'openStats':
      return [true]
    case 'regularStats':
      return [false]
    default:
      return [true, false]
  }
}

/* from & to are semestercodes if separate = false, or yearcodes in case separate is true. */
export const findByCourseAndSemesters = async (
  coursecodes: string[],
  from: number,
  to: number,
  separate: boolean,
  unifyCourses: UnifyStatus = 'unifyStats'
) => {
  const startSemester = await Semester.findOne({
    where: {
      [separate ? 'semestercode' : 'yearcode']: from,
    },
    order: ['semestercode'],
    limit: 1,
    raw: true,
  })

  const endSemester = await Semester.findOne({
    where: {
      [separate ? 'semestercode' : 'yearcode']: to,
    },
    order: [['semestercode', 'DESC']],
    limit: 1,
    raw: true,
  })

  if (!startSemester || !endSemester) {
    return []
  }

  const { startdate, semestercode: fromSemester } = startSemester
  const { enddate, semestercode: toSemester } = endSemester

  const unifyStatus = getUnifyStatus(unifyCourses)

  type QueryResult = {
    studentnumber: string
  }[]

  const queryResult: QueryResult = await sequelize.query(
    `
    SELECT
      studentnumber
    FROM
      student s
    WHERE
      EXISTS (
        SELECT
          1
        FROM
          credit c
        WHERE
          c.student_studentnumber = s.studentnumber
          AND c.course_code IN (:coursecodes)
          AND c.is_open IN (:isOpen)
          AND c.attainment_date BETWEEN '${startdate.toISOString()}' AND '${enddate.toISOString()}'
      )
      OR EXISTS (
        SELECT
          1
        FROM
          enrollment e
        WHERE
          e.studentnumber = s.studentnumber
          AND e.course_code IN (:coursecodes)
          AND e.semestercode BETWEEN ${fromSemester} AND ${toSemester}
          AND e.enrollment_date_time >= '2021-05-31'
          AND e.state IN ('ENROLLED', 'CONFIRMED')
      );
    `,
    {
      replacements: { coursecodes, minYearCode: from, maxYearCode: to, isOpen: unifyStatus },
      type: QueryTypes.SELECT,
      raw: true,
    }
  )

  const studentNumbers = queryResult.map(result => result.studentnumber)
  return studentNumbers
}

export const findByTag = async (tag: string) => {
  return (
    await TagStudent.findAll({
      attributes: ['studentnumber'],
      where: {
        tag_id: {
          [Op.eq]: tag,
        },
      },
    })
  ).map(st => st.studentnumber)
}

const formatSharedStudentData = ({
  firstnames,
  lastname,
  studentnumber,
  dateofuniversityenrollment,
  creditcount,
  credits,
  abbreviatedname,
  email,
  studyRights,
  semester_enrollments,
  studyplans,
  updatedAt,
  createdAt,
  sis_person_id,
}: Partial<Omit<Student, 'semester_enrollments'>> & { semester_enrollments: SemesterEnrollmentWithNameAndYear[] }) => {
  const toCourse = ({ grade, credits, credittypecode, is_open, attainment_date, course, isStudyModule }: Credit) => {
    course = course.toJSON()

    return {
      course: {
        code: course.code,
        name: course.name,
      },
      date: attainment_date,
      passed: Credit.passed({ credittypecode }) || Credit.improved({ credittypecode }),
      grade,
      credits,
      credittypecode,
      isStudyModuleCredit: isStudyModule,
      isOpenCourse: is_open,
    }
  }

  studyRights = studyRights || []
  semester_enrollments = semester_enrollments || []
  studyplans = studyplans || []
  const semesterenrollments = semester_enrollments.map(
    ({ semestercode, enrollmenttype, name, yearname, startYear, statutory_absence: statutoryAbsence }) => ({
      yearname,
      name,
      startYear,
      semestercode,
      enrollmenttype,
      statutoryAbsence,
    })
  )

  if (credits === undefined) {
    credits = []
  }

  const formattedCredits = credits
    .sort((a, b) => new Date(a.attainment_date).getTime() - new Date(b.attainment_date).getTime())
    .map(toCourse)

  return {
    firstnames,
    lastname,
    studyRights,
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount || 0,
    courses: formattedCredits,
    name: abbreviatedname,
    email,
    semesterenrollments,
    updatedAt: updatedAt || createdAt,
    studyplans,
    sis_person_id,
  }
}

const formatStudent = (
  studentData: Partial<Omit<Student, 'semester_enrollments'>> & {
    semester_enrollments: SemesterEnrollmentWithNameAndYear[]
  } & { tags: TagStudent[] }
) => {
  const formattedData = formatSharedStudentData(studentData)
  return {
    ...formattedData,
    tags: studentData.tags,
  }
}

const formatStudentWithoutTags = (
  studentData: Partial<Omit<Student, 'semester_enrollments'>> & {
    semester_enrollments: SemesterEnrollmentWithNameAndYear[]
  }
) => {
  return formatSharedStudentData(studentData)
}

export const withStudentNumber = async (studentNumber: string) => {
  try {
    const student = await byStudentNumber(studentNumber)
    if (!student) return null
    return formatStudent(student)
  } catch (error) {
    logger.error(`Error when fetching single student ${error}`)
    return {
      error,
    }
  }
}

const likefy = (term: string) => `%${term}%`

const columnLike = (column: string, term: string) => ({
  [column]: {
    [Op.iLike]: likefy(term),
  },
})

const nameLike = (terms: string[]) => {
  const [first, second] = terms
  if (!second) {
    return columnLike('abbreviatedname', first)
  }
  return {
    [Op.or]: [
      columnLike('abbreviatedname', `%${first}%${second}%`),
      columnLike('abbreviatedname', `%${second}%${first}%`),
    ],
  }
}

const studentnumberLike = (terms: string[]) => {
  return {
    studentnumber: {
      [Op.iLike]: likefy(terms[0]),
    },
  }
}

export const bySearchTermAndStudentNumbers = async (searchterm: string, studentNumbers?: string[]) => {
  const terms = splitByEmptySpace(searchterm)
  return (
    await Student.findAll({
      attributes: ['studentnumber', 'firstnames', 'lastname', 'creditcount', 'dateofuniversityenrollment'],
      include: {
        model: SISStudyRight,
        as: 'studyRights',
        attributes: ['id'],
        include: [
          {
            model: SISStudyRightElement,
            as: 'studyRightElements',
            attributes: ['name'],
            required: true,
            where: {
              endDate: {
                [Op.gte]: new Date(),
              },
            },
          },
        ],
      },
      where: studentNumbers
        ? {
            [Op.and]: {
              [Op.or]: [nameLike(terms), studentnumberLike(terms)],
              studentnumber: {
                [Op.in]: studentNumbers,
              },
            },
          }
        : { [Op.or]: [nameLike(terms), studentnumberLike(terms)] },
    })
  ).map(formatStudentWithoutTags)
}

export const filterStudentnumbersByAccessrights = async (studentnumbers: string[], codes: string[]) =>
  (
    await Student.findAll({
      attributes: ['studentnumber'],
      include: {
        attributes: [],
        model: SISStudyRight,
        as: 'studyRights',
        required: true,
        include: [
          {
            model: SISStudyRightElement,
            as: 'studyRightElements',
            where: {
              code: {
                [Op.in]: codes,
              },
            },
          },
        ],
      },
      where: {
        studentnumber: {
          [Op.in]: studentnumbers,
        },
      },
      raw: true,
    })
  ).map(({ studentnumber }) => studentnumber)

export const getStudentnumbersByElementdetails = async (codes: string[]) =>
  (
    await Student.findAll({
      attributes: ['studentnumber'],
      include: {
        attributes: [],
        model: SISStudyRight,
        as: 'studyRights',
        required: true,
        include: [
          {
            model: SISStudyRightElement,
            as: 'studyRightElements',
            where: {
              code: {
                [Op.in]: codes,
              },
            },
          },
        ],
      },
      raw: true,
    })
  ).map(({ studentnumber }) => studentnumber)
