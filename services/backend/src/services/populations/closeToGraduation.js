const { Op, col } = require('sequelize')

const {
  Course,
  Credit,
  Organization,
  Student,
  Studyplan,
  SISStudyRight,
  SISStudyRightElement,
} = require('../../models')
const { mapToProviders } = require('../../util/map')
const { redisClient } = require('../redis')
const { getCurriculumVersion } = require('./shared')

const CLOSE_TO_GRADUATION_REDIS_KEY = 'CLOSE_TO_GRADUATION_DATA'

const findThesisAndLatestAttainments = (studyPlan, attainments, providerCode) => {
  let thesisData
  const latestAttainmentDates = {}
  const thesisCodes = ['urn:code:course-unit-type:bachelors-thesis', 'urn:code:course-unit-type:masters-thesis']

  for (const attainment of attainments) {
    if (
      thesisCodes.includes(attainment.course?.course_unit_type) &&
      attainment.course.organizations.some(org => org.code === providerCode)
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

const formatStudent = student => {
  const { studentNumber, name, sis_person_id, email, phoneNumber, secondaryEmail } = student
  return student.studyplans.reduce((acc, studyPlan) => {
    const { studyRight } = studyPlan
    const { studyRightElements, startDate: startOfStudyright, extentCode, semesterEnrollments } = studyRight

    const { programmeCode, programmeName, studyTrack, startDate: programmeStartDate } = studyRightElements[0]
    const programmeCodeToProviderCode = mapToProviders([programmeCode])[0]
    const { latestAttainmentDates, thesisData } = findThesisAndLatestAttainments(
      studyPlan,
      student.credits,
      programmeCodeToProviderCode
    )

    acc.push({
      student: { studentNumber, name, sis_person_id, email, phoneNumber, secondaryEmail },
      studyright: {
        startDate: startOfStudyright,
        semesterEnrollments,
        isBaMa: extentCode === 5,
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

const findStudentsCloseToGraduation = async studentNumbers =>
  (
    await Student.findAll({
      attributes: [
        ['abbreviatedname', 'name'],
        'creditcount',
        'email',
        ['phone_number', 'phoneNumber'],
        ['secondary_email', 'secondaryEmail'],
        'sis_person_id',
        ['studentnumber', 'studentNumber'],
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
              { completed_credits: { [Op.gte]: 160 }, programme_code: { [Op.like]: 'KH%' } },
              { completed_credits: { [Op.gte]: 150 }, programme_code: 'MH90_001' }, // De­gree Pro­gramme in Veter­in­ary Medi­cine
              { completed_credits: { [Op.gte]: 330 }, programme_code: 'MH30_001' }, // De­gree Pro­gramme in Medi­cine
              { completed_credits: { [Op.gte]: 300 }, programme_code: 'MH30_003' }, // De­gree Pro­gramme in Dentistry
              { completed_credits: { [Op.gte]: 115 }, programme_code: 'MH30_004' }, // Mas­ter's Pro­gramme in Psy­cho­logy
              {
                completed_credits: { [Op.gte]: 85 },
                programme_code: { [Op.like]: 'MH%', [Op.notIn]: ['MH90_001', 'MH30_001', 'MH30_003', 'MH30_004'] },
              },
            ],
          },
          include: [
            {
              model: SISStudyRight,
              as: 'studyRight',
              attributes: ['semesterEnrollments', 'startDate', 'extentCode'],
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
                  },
                  attributes: [['code', 'programmeCode'], ['name', 'programmeName'], 'startDate', 'studyTrack'],
                },
              ],
            },
          ],
        },
        {
          model: Credit,
          attributes: ['attainment_date', 'grade'],
          where: { credittypecode: 4 },
          include: {
            model: Course,
            attributes: ['code', 'course_unit_type'],
            include: {
              model: Organization,
              attributes: ['code'],
              through: {
                attributes: [],
              },
            },
          },
        },
      ],
      order: [[{ model: Credit }, 'attainment_date', 'DESC']],
    })
  )
    .flatMap(student => formatStudent(student.toJSON()))
    .reduce(
      (acc, student) => {
        if (student.programme.code.startsWith('KH')) {
          acc.bachelor.push(student)
        } else {
          acc.masterAndLicentiate.push(student)
        }
        return acc
      },
      { bachelor: [], masterAndLicentiate: [] }
    )

const getCloseToGraduationData = async studentNumbers => {
  if (!studentNumbers) {
    const dataOnRedis = await redisClient.getAsync(CLOSE_TO_GRADUATION_REDIS_KEY)
    if (dataOnRedis) return JSON.parse(dataOnRedis)
    const freshData = await findStudentsCloseToGraduation()
    redisClient.setAsync(CLOSE_TO_GRADUATION_REDIS_KEY, JSON.stringify(freshData))
    return freshData
  }
  return findStudentsCloseToGraduation(studentNumbers)
}

module.exports = {
  findStudentsCloseToGraduation,
  getCloseToGraduationData,
  CLOSE_TO_GRADUATION_REDIS_KEY,
}
