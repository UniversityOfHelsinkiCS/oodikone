import { Op, QueryTypes } from 'sequelize'

import type { Credit, Student } from '@oodikone/shared/models'
import { EnrollmentState, UnifyStatus } from '@oodikone/shared/types'
import { FormattedStudentForSearch, StudentPageStudent } from '@oodikone/shared/types/studentData'
import { splitByEmptySpace } from '@oodikone/shared/util'
import { dbConnections } from '../database/connection'
import {
  StudentModel,
  CreditModel,
  CourseModel,
  ProgrammeModuleModel,
  SemesterModel,
  StudyplanModel,
  SISStudyRightModel,
  SISStudyRightElementModel,
} from '../models'
import { TagModel, TagStudentModel } from '../models/kone'

const { sequelize } = dbConnections

const byStudentNumber = async (studentNumber: string) => {
  const [student, tags] = await Promise.all([
    StudentModel.findByPk(studentNumber, {
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
          model: CreditModel,
          attributes: ['grade', 'credits', 'credittypecode', 'is_open', 'attainment_date', 'isStudyModule'],
          separate: true,
          include: [
            {
              model: CourseModel,
              attributes: ['code', 'name'],
              required: true,
            },
          ],
        },
        {
          model: SISStudyRightModel,
          as: 'studyRights',
          include: [
            {
              required: true,
              model: SISStudyRightElementModel,
              as: 'studyRightElements',
            },
          ],
        },
        {
          model: StudyplanModel,
          attributes: ['id', 'included_courses', 'programme_code', 'completed_credits', 'sis_study_right_id'],
        },
      ],
      order: [
        [
          { model: SISStudyRightModel, as: 'studyRights' },
          { model: SISStudyRightElementModel, as: 'studyRightElements' },
          'endDate',
          'desc',
        ],
      ],
    }),
    TagStudentModel.findAll({
      attributes: ['tag_id'],
      include: {
        model: TagModel,
        attributes: ['personal_user_id', 'studytrack', 'tagname', 'year'],
      },
      where: {
        studentnumber: studentNumber,
      },
    }),
  ])
  if (!student) return null
  const tagprogrammes = await ProgrammeModuleModel.findAll({
    attributes: ['code', 'name'],
    where: {
      code: {
        [Op.in]: tags.map(tag => tag.tag.studytrack),
      },
    },
  })

  return {
    ...student.toJSON(),
    tags: tags.map(tag => ({
      ...tag.get(),
      programme: tagprogrammes.find(programme => programme.code === tag.tag.studytrack),
    })),
  }
}

const getUnifyStatus = (unifyCourses: UnifyStatus): [boolean] | [true, false] => {
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
  const startSemester = await SemesterModel.findOne({
    where: {
      [separate ? 'semestercode' : 'yearcode']: from,
    },
    order: ['semestercode'],
    limit: 1,
    raw: true,
  })

  const endSemester = await SemesterModel.findOne({
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
          AND e.state = :enrollmentState
      );
    `,
    {
      replacements: {
        coursecodes,
        minYearCode: from,
        maxYearCode: to,
        isOpen: unifyStatus,
        enrollmentState: EnrollmentState.ENROLLED,
      },
      type: QueryTypes.SELECT,
      raw: true,
    }
  )

  const studentNumbers = queryResult.map(result => result.studentnumber)
  return studentNumbers
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
  studyplans,
  updatedAt,
  createdAt,
  sis_person_id,
}: Student): Omit<StudentPageStudent, 'tags'> => {
  const toCourse = ({ grade, credits, credittypecode, is_open, attainment_date, course, isStudyModule }: Credit) => {
    return {
      course: {
        code: course.code,
        name: course.name,
      },
      date: attainment_date,
      passed: CreditModel.passed({ credittypecode }) || CreditModel.improved({ credittypecode }),
      grade,
      credits,
      credittypecode,
      isStudyModuleCredit: isStudyModule,
      isOpenCourse: is_open,
    }
  }

  const formattedCredits = (credits ?? [])
    .sort((a, b) => new Date(a.attainment_date).getTime() - new Date(b.attainment_date).getTime())
    .map(toCourse)

  return {
    firstNames: firstnames,
    lastName: lastname,
    studyRights: studyRights || [],
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount || 0,
    courses: formattedCredits,
    name: abbreviatedname,
    email,
    updatedAt: updatedAt || createdAt,
    studyplans: studyplans || [],
    sisPersonId: sis_person_id,
  }
}

export const withStudentNumber = async (studentNumber: string, userId: string): Promise<StudentPageStudent | null> => {
  const student = await byStudentNumber(studentNumber)
  if (student == null) {
    return null
  }
  return {
    ...formatSharedStudentData(student),
    tags: student.tags
      .filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId)
      .map(tag => ({
        programme: tag.programme,
        tagId: tag.tag_id,
        tag: tag.tag,
      })),
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

const studentNumberLike = (terms: string[]) => {
  return {
    studentnumber: {
      [Op.iLike]: likefy(terms[0]),
    },
  }
}

const formatStudentForSearch = ({
  creditcount,
  dateofuniversityenrollment,
  firstnames,
  lastname,
  studentnumber,
  studyRights,
}: Student): FormattedStudentForSearch => ({
  activeStudyRights: studyRights || [],
  credits: creditcount || 0,
  firstNames: firstnames,
  lastName: lastname,
  studentNumber: studentnumber,
  started: dateofuniversityenrollment.toString(),
})

export const bySearchTermAndStudentNumbers = async (searchTerm: string, studentNumbers?: string[]) => {
  const terms = splitByEmptySpace(searchTerm)
  return (
    await StudentModel.findAll({
      attributes: ['studentnumber', 'firstnames', 'lastname', 'creditcount', 'dateofuniversityenrollment'],
      include: {
        model: SISStudyRightModel,
        as: 'studyRights',
        attributes: ['id'],
        include: [
          {
            model: SISStudyRightElementModel,
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
              [Op.or]: [nameLike(terms), studentNumberLike(terms)],
              studentnumber: {
                [Op.in]: studentNumbers,
              },
            },
          }
        : { [Op.or]: [nameLike(terms), studentNumberLike(terms)] },
      order: [['dateofuniversityenrollment', 'DESC NULLS LAST']],
    })
  ).map(formatStudentForSearch)
}

export const filterStudentNumbersByAccessRights = async (studentnumbers: string[], codes: string[]) =>
  (
    await StudentModel.findAll({
      attributes: ['studentnumber'],
      include: {
        attributes: [],
        model: SISStudyRightModel,
        as: 'studyRights',
        required: true,
        include: [
          {
            model: SISStudyRightElementModel,
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
    await StudentModel.findAll({
      attributes: ['studentnumber'],
      include: {
        attributes: [],
        model: SISStudyRightModel,
        as: 'studyRights',
        required: true,
        include: [
          {
            model: SISStudyRightElementModel,
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
