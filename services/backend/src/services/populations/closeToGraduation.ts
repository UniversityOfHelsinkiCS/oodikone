import { col, Op } from 'sequelize'

import { Course, Credit, Student, Studyplan, SISStudyRight, SISStudyRightElement } from '../../models'
import { CreditTypeCode, DegreeProgrammeType, ExtentCode, Name, SemesterEnrollment } from '../../types'
import { redisClient } from '../redis'
import { getCurriculumVersion } from './shared'

export const CLOSE_TO_GRADUATION_REDIS_KEY = 'CLOSE_TO_GRADUATION_DATA'

type LatestAttainmentDates = {
  total?: Date
  hops?: Date
}

type AccumulatorType = {
  student: {
    studentNumber: string
    name: string
    sis_person_id: string
    email: string
    phoneNumber: string
    secondaryEmail: string
  }
  studyright: {
    startDate: Date
    semesterEnrollments: SemesterEnrollment[] | null
    isBaMa: boolean
  }
  thesisInfo: {
    grade: string
    attainmentDate: Date
    courseCode: string
  } | null
  programme: {
    code: string
    name: Name
    studyTrack: Name | null
    startedAt: Date
    degreeProgrammeType: DegreeProgrammeType
  }
  latestAttainmentDates: LatestAttainmentDates
  curriculumPeriod: string | null
  credits: {
    hops: number
    all: number
  }
}

const findThesisAndLatestAttainments = (
  studyPlan: Studyplan,
  attainments: Credit[],
  degreeProgrammeType: DegreeProgrammeType,
  studyRightId: string
) => {
  let thesisData: Credit | undefined
  const latestAttainmentDates: LatestAttainmentDates = {}
  const thesisCodes = {
    [DegreeProgrammeType.BACHELOR]: 'urn:code:course-unit-type:bachelors-thesis',
    [DegreeProgrammeType.MASTER]: 'urn:code:course-unit-type:masters-thesis',
  }

  for (const attainment of attainments) {
    if (
      attainment.course?.course_unit_type === thesisCodes[degreeProgrammeType] &&
      attainment.studyright_id === studyRightId
    ) {
      thesisData = attainment
    }
    if (!latestAttainmentDates.total) {
      latestAttainmentDates.total = attainment.attainment_date
    }
    if (!latestAttainmentDates.hops && studyPlan.included_courses.includes(attainment.course?.code)) {
      latestAttainmentDates.hops = attainment.attainment_date
    }
    if (thesisData && latestAttainmentDates.total && latestAttainmentDates.hops) {
      break
    }
  }

  return { latestAttainmentDates, thesisData }
}

const formatStudent = (student: Student) => {
  const {
    studentnumber: studentNumber,
    abbreviatedname: name,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    sis_person_id,
    email,
    phone_number: phoneNumber,
    secondary_email: secondaryEmail,
  } = student
  return student.studyplans.reduce<AccumulatorType[]>((acc, studyPlan) => {
    const { studyRight } = studyPlan
    const {
      id: studyRightId,
      studyRightElements,
      startDate: startOfStudyright,
      extentCode,
      semesterEnrollments,
    } = studyRight

    const {
      code: programmeCode,
      name: programmeName,
      studyTrack,
      startDate: programmeStartDate,
      degreeProgrammeType,
    } = studyRightElements[0]
    const { latestAttainmentDates, thesisData } = findThesisAndLatestAttainments(
      studyPlan,
      student.credits,
      degreeProgrammeType,
      studyRightId
    )

    acc.push({
      student: { studentNumber, name, sis_person_id, email, phoneNumber, secondaryEmail },
      studyright: {
        startDate: startOfStudyright,
        semesterEnrollments,
        isBaMa: extentCode === ExtentCode.BACHELOR_AND_MASTER,
      },
      thesisInfo: thesisData
        ? {
            grade: thesisData.grade,
            attainmentDate: thesisData.attainment_date,
            courseCode: thesisData.course.code,
          }
        : null,
      programme: {
        code: programmeCode,
        name: programmeName,
        studyTrack: studyTrack ? studyTrack.name : null,
        startedAt: programmeStartDate,
        degreeProgrammeType,
      },
      latestAttainmentDates,
      curriculumPeriod: getCurriculumVersion(studyPlan.curriculum_period_id),
      credits: {
        hops: studyPlan.completed_credits,
        all: student.creditcount,
      },
    })
    return acc
  }, [])
}

export const findStudentsCloseToGraduation = async (studentNumbers?: string[]) =>
  (
    await Student.findAll({
      attributes: [
        'abbreviatedname',
        'creditcount',
        'email',
        'phone_number',
        'secondary_email',
        'sis_person_id',
        'studentnumber',
      ],
      where: studentNumbers
        ? {
            studentnumber: {
              [Op.in]: studentNumbers,
            },
          }
        : {},
      include: [
        {
          model: Studyplan,
          attributes: ['completed_credits', 'included_courses', 'programme_code', 'curriculum_period_id'],
          where: {
            [Op.or]: [
              { completed_credits: { [Op.gte]: 140 }, programme_code: { [Op.like]: 'KH%' } },
              { completed_credits: { [Op.gte]: 150 }, programme_code: 'MH90_001' }, // De­gree Pro­gramme in Veter­in­ary Medi­cine
              { completed_credits: { [Op.gte]: 330 }, programme_code: 'MH30_001' }, // De­gree Pro­gramme in Medi­cine
              { completed_credits: { [Op.gte]: 300 }, programme_code: 'MH30_003' }, // De­gree Pro­gramme in Dentistry
              { completed_credits: { [Op.gte]: 115 }, programme_code: 'MH30_004' }, // Mas­ter's Pro­gramme in Psy­cho­logy
              {
                completed_credits: { [Op.gte]: 70 },
                programme_code: { [Op.like]: 'MH%', [Op.notIn]: ['MH90_001', 'MH30_001', 'MH30_003', 'MH30_004'] },
              },
            ],
          },
          include: [
            {
              model: SISStudyRight,
              as: 'studyRight',
              attributes: ['id', 'semesterEnrollments', 'startDate', 'extentCode'],
              where: { cancelled: false },
              include: [
                {
                  model: SISStudyRightElement,
                  as: 'studyRightElements',
                  where: {
                    graduated: false,
                    endDate: {
                      [Op.gte]: new Date(),
                    },
                    '$studyplans.programme_code$': {
                      [Op.eq]: col('studyplans->studyRight->studyRightElements.code'),
                    },
                    degreeProgrammeType: {
                      [Op.in]: [DegreeProgrammeType.BACHELOR, DegreeProgrammeType.MASTER],
                    },
                  },
                  attributes: ['code', 'name', 'startDate', 'studyTrack', 'degreeProgrammeType'],
                },
              ],
            },
          ],
        },
        {
          model: Credit,
          attributes: ['attainment_date', 'grade', 'studyright_id'],
          where: { credittypecode: CreditTypeCode.PASSED },
          include: [
            {
              model: Course,
              attributes: ['code', 'course_unit_type'],
            },
          ],
        },
      ],
      order: [[{ model: Credit, as: 'credits' }, 'attainment_date', 'DESC']],
    })
  )
    .flatMap(student => formatStudent(student.toJSON()))
    .reduce(
      (acc, student) => {
        if (student.programme.degreeProgrammeType === DegreeProgrammeType.BACHELOR) {
          acc.bachelor.push(student)
        } else {
          acc.masterAndLicentiate.push(student)
        }
        return acc
      },
      { bachelor: [] as AccumulatorType[], masterAndLicentiate: [] as AccumulatorType[] }
    )

export const getCloseToGraduationData = async (studentNumbers?: string[]) => {
  if (!studentNumbers) {
    const dataOnRedis = await redisClient.get(CLOSE_TO_GRADUATION_REDIS_KEY)
    if (dataOnRedis) {
      return JSON.parse(dataOnRedis)
    }
    const freshData = await findStudentsCloseToGraduation()
    await redisClient.set(CLOSE_TO_GRADUATION_REDIS_KEY, JSON.stringify(freshData))
    return freshData
  }
  return findStudentsCloseToGraduation(studentNumbers)
}
