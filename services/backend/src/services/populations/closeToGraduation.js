const { Op, col } = require('sequelize')

const { getCurriculumVersion } = require('./shared')
const {
  ElementDetail,
  Student,
  Studyplan,
  Studyright,
  StudyrightElement,
  Credit,
  Course,
  Organization,
} = require('../../models')
const { mapToProviders } = require('../../util/utils')
const { redisClient } = require('../redis')

const CLOSE_TO_GRADUATION_REDIS_KEY = 'CLOSE_TO_GRADUATION_DATA'

const findThesisAndLatestAttainments = (student, providerCode) => {
  let thesisData
  const latestAttainmentDates = {}
  const thesisCodes = ['urn:code:course-unit-type:bachelors-thesis', 'urn:code:course-unit-type:masters-thesis']

  for (const attainment of student.credits) {
    if (
      thesisCodes.includes(attainment.course?.course_unit_type) &&
      attainment.course.organizations.some(org => org.code === providerCode)
    ) {
      thesisData = attainment
    }
    if (!latestAttainmentDates.total) {
      latestAttainmentDates.total = attainment.attainment_date
    }
    if (!latestAttainmentDates.hops && student.studyplans[0].included_courses.includes(attainment.course?.code)) {
      latestAttainmentDates.hops = attainment.attainment_date
    }
    if (thesisData && latestAttainmentDates.total && latestAttainmentDates.hops) {
      break
    }
  }

  return { latestAttainmentDates, thesisData }
}

const formatStudent = student => {
  const {
    studentnumber: studentNumber,
    abbreviatedname: name,
    sis_person_id,
    email,
    phone_number: phoneNumber,
    secondary_email: secondaryEmail,
  } = student
  const semesterEnrollments = {}
  for (const enrollment of student.studyplans[0].studyright.semesterEnrollments) {
    semesterEnrollments[enrollment.semestercode] = {
      type: enrollment.enrollmenttype,
      statutoryAbsence: enrollment.statutoryAbsence,
    }
  }
  const {
    studyright_elements: studyrightElements,
    startdate: startOfStudyright,
    isBaMa,
  } = student.studyplans[0].studyright
  const programmeCode = student.studyplans[0].programme_code
  const programme = studyrightElements?.find(
    element => element?.element_detail.type === 20 && element.code === programmeCode
  )
  const programmeCodeToProviderCode = mapToProviders([programmeCode])[0]
  const { latestAttainmentDates, thesisData } = findThesisAndLatestAttainments(student, programmeCodeToProviderCode)
  const studyTrack =
    studyrightElements?.find(element => element?.element_detail.type === 30)?.element_detail?.name ?? null

  return {
    student: { studentNumber, name, sis_person_id, email, phoneNumber, secondaryEmail },
    studyright: {
      startDate: startOfStudyright,
      semesterEnrollments: student.studyplans[0].studyright.semesterEnrollments,
      isBaMa,
    },
    thesisInfo: thesisData
      ? {
          grade: thesisData.grade,
          attainmentDate: thesisData.attainment_date,
          courseCode: thesisData.course.code,
        }
      : null,
    programme: {
      code: programme?.element_detail?.code,
      name: programme?.element_detail?.name,
      studyTrack,
      startedAt: programme?.startdate,
    },
    latestAttainmentDates,
    curriculumPeriod: getCurriculumVersion(student.studyplans[0].curriculum_period_id),
    credits: {
      hops: student.studyplans[0].completed_credits,
      all: student.creditcount,
    },
  }
}

const findStudentsCloseToGraduation = async studentNumbers =>
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
              model: Studyright,
              attributes: ['semesterEnrollments', 'startdate', 'studyrightid', 'isBaMa'],
              where: {
                graduated: 0,
                cancelled: false,
              },
              include: [
                {
                  model: StudyrightElement,
                  attributes: ['code', 'startdate'],
                  where: {
                    enddate: {
                      [Op.gte]: new Date(),
                    },
                  },
                  include: [
                    {
                      model: ElementDetail,
                      attributes: ['code', 'name', 'type'],
                      where: {
                        [Op.or]: [
                          {
                            '$studyplans.programme_code$': {
                              [Op.eq]: col('studyplans->studyright->studyright_elements.code'),
                            },
                          },
                          {
                            type: 30,
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: Credit,
          attributes: ['attainment_date', 'grade'],
          where: {
            credittypecode: 4,
          },
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
    .map(student => formatStudent(student.toJSON()))
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
