import { col, Op, where } from 'sequelize'

import { Credit, Student, Studyplan } from '@oodikone/shared/models'
import {
  Name,
  CreditTypeCode,
  DegreeProgrammeType,
  EnrollmentType,
  ExtentCode,
  SemesterEnrollment,
} from '@oodikone/shared/types'
import {
  CourseModel,
  CreditModel,
  OrganizationModel,
  ProgrammeModuleModel,
  StudentModel,
  StudyplanModel,
  SISStudyRightModel,
  SISStudyRightElementModel,
} from '../../models'
import { redisClient } from '../redis'
import { getCurrentSemester } from '../semesters'
import { getCurriculumVersion } from './shared'

export const CLOSE_TO_GRADUATION_REDIS_KEY = 'CLOSE_TO_GRADUATION_DATA'

type AttainmentDates = {
  latestTotal?: Date
  latestHops?: Date
  earliestHops?: Date
}

type AccumulatorType = {
  student: {
    studentNumber: string
    name: string
    sis_person_id: string
    email: string
    phoneNumber: string
    secondaryEmail: string
    preferredLanguage: string
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
  faculty: Name
  attainmentDates: AttainmentDates
  numberOfAbsentSemesters: number
  numberOfUsedSemesters: number
  curriculumPeriod: string | null
  credits: {
    hops: number
    all: number
  }
}

const findThesisAndLatestAndEarliestAttainments = (
  studyPlan: Studyplan,
  attainments: Credit[],
  degreeProgrammeType: DegreeProgrammeType,
  studyRightId: string
) => {
  let thesisData: Credit | undefined
  const attainmentDates: AttainmentDates = {}
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
    attainmentDates.latestTotal ??= attainment.attainment_date
    if (studyPlan.included_courses.includes(attainment.course?.code)) {
      attainmentDates.latestHops ??= attainment.attainment_date
      if (
        !attainmentDates.earliestHops ||
        attainment.attainment_date.getTime() < attainmentDates.earliestHops.getTime()
      ) {
        attainmentDates.earliestHops = attainment.attainment_date
      }
    }
  }

  return { attainmentDates, thesisData }
}

const formatStudent = (student: Student, facultyMap: Record<string, Name>, currentSemesterCode: number) => {
  const {
    studentnumber: studentNumber,
    abbreviatedname: name,
    sis_person_id,
    email,
    phone_number: phoneNumber,
    preferredLanguage,
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

    let numberOfAbsentSemesters = 0
    let numberOfUsedSemesters = 0

    if (semesterEnrollments != null) {
      for (const enrollment of semesterEnrollments) {
        if (enrollment.semester > currentSemesterCode) continue

        if (enrollment.type === EnrollmentType.ABSENT) {
          numberOfAbsentSemesters += 1
        } else {
          numberOfUsedSemesters += 1
        }
      }
    }

    const {
      code: programmeCode,
      name: programmeName,
      studyTrack,
      startDate: programmeStartDate,
      degreeProgrammeType,
    } = studyRightElements[0]
    const { attainmentDates, thesisData } = findThesisAndLatestAndEarliestAttainments(
      studyPlan,
      student.credits,
      degreeProgrammeType,
      studyRightId
    )

    acc.push({
      student: { studentNumber, name, sis_person_id, email, phoneNumber, secondaryEmail, preferredLanguage },
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
      faculty: facultyMap[programmeCode],
      attainmentDates,
      numberOfAbsentSemesters,
      numberOfUsedSemesters,
      curriculumPeriod: getCurriculumVersion(studyPlan.curriculum_period_id),
      credits: {
        hops: studyPlan.completed_credits,
        all: student.creditcount,
      },
    })
    return acc
  }, [])
}

export const findStudentsCloseToGraduation = async (studentNumbers?: string[]) => {
  const students = (
    await StudentModel.findAll({
      attributes: [
        'abbreviatedname',
        'creditcount',
        'email',
        'phone_number',
        'preferredLanguage',
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
          model: StudyplanModel,
          attributes: ['completed_credits', 'included_courses', 'programme_code', 'curriculum_period_id'],
          required: true,
          include: [
            {
              model: SISStudyRightModel,
              as: 'studyRight',
              attributes: ['id', 'semesterEnrollments', 'startDate', 'extentCode'],
              where: { cancelled: false },
              include: [
                {
                  model: SISStudyRightElementModel,
                  as: 'studyRightElements',
                  where: {
                    graduated: false,
                    endDate: {
                      [Op.gte]: new Date(),
                    },
                    '$studyplans.programme_code$': {
                      [Op.eq]: col('studyplans->studyRight->studyRightElements.code'),
                    },
                    [Op.or]: [
                      {
                        [Op.and]: [
                          { degreeProgrammeType: DegreeProgrammeType.BACHELOR },
                          where(col('studyplans.completed_credits'), Op.gte, 140),
                        ],
                      },
                      {
                        [Op.and]: [
                          { degreeProgrammeType: DegreeProgrammeType.MASTER },
                          where(col('studyplans.completed_credits'), Op.gte, 70),
                          { code: { [Op.notIn]: ['MH30_001', 'MH30_003', 'MH30_004', 'MH90_001'] } },
                        ],
                      },
                      {
                        [Op.and]: [
                          where(col('studyplans.completed_credits'), Op.gte, 330),
                          { code: 'MH30_001' }, // De­gree Pro­gramme in Medi­cine
                        ],
                      },
                      {
                        [Op.and]: [
                          where(col('studyplans.completed_credits'), Op.gte, 300),
                          { code: 'MH30_003' }, // De­gree Pro­gramme in Dentistry
                        ],
                      },
                      {
                        [Op.and]: [
                          where(col('studyplans.completed_credits'), Op.gte, 115),
                          { code: 'MH30_004' }, // Mas­ter's Pro­gramme in Psy­cho­logy
                        ],
                      },
                      {
                        [Op.and]: [
                          where(col('studyplans.completed_credits'), Op.gte, 150),
                          { code: 'MH90_001' }, // De­gree Pro­gramme in Veter­in­ary Medi­cine
                        ],
                      },
                    ],
                  },
                  attributes: ['code', 'name', 'startDate', 'studyTrack', 'degreeProgrammeType'],
                },
              ],
            },
          ],
        },
        {
          model: CreditModel,
          attributes: ['attainment_date', 'grade', 'studyright_id'],
          where: { credittypecode: CreditTypeCode.PASSED },
          include: [
            {
              model: CourseModel,
              attributes: ['code', 'course_unit_type'],
            },
          ],
        },
      ],
      order: [[{ model: CreditModel, as: 'credits' }, 'attainment_date', 'DESC']],
    })
  ).map(student => student.toJSON())

  const programmeCodes = [...new Set(students.flatMap(student => student.studyplans.map(sp => sp.programme_code)))]
  const programmesWithFaculties = await ProgrammeModuleModel.findAll({
    attributes: ['code'],
    where: {
      code: {
        [Op.in]: programmeCodes,
      },
    },
    include: {
      model: OrganizationModel,
      attributes: ['name'],
    },
    raw: true,
  })

  const facultyMap: Record<string, Name> = {}
  for (const programme of programmesWithFaculties) {
    facultyMap[programme.code] = programme['organization.name']
  }

  const { semestercode: currentSemesterCode } = await getCurrentSemester()

  return students
    .flatMap(student => formatStudent(student, facultyMap, currentSemesterCode))
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
}

export const getCloseToGraduationData = async (studentNumbers?: string[]) => {
  if (!studentNumbers) {
    const dataOnRedis = await redisClient.get(CLOSE_TO_GRADUATION_REDIS_KEY)
    if (dataOnRedis) {
      return JSON.parse(dataOnRedis)
    }
    const freshData = { ...(await findStudentsCloseToGraduation()), lastUpdated: new Date().toISOString() }
    await redisClient.set(CLOSE_TO_GRADUATION_REDIS_KEY, JSON.stringify(freshData))
    return freshData
  }
  return findStudentsCloseToGraduation(studentNumbers)
}
