const { Op } = require('sequelize')

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

  for (const attainment of student.credits) {
    if (
      attainment.course?.course_unit_type === 'urn:code:course-unit-type:bachelors-thesis' &&
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
  const { studyright_elements: studyrightElements, startdate: startOfStudyright } = student.studyplans[0].studyright
  const programmeCode = student.studyplans[0].programme_code
  const programme = studyrightElements?.find(
    element => element?.element_detail.type === 20 && element.code === programmeCode
  )?.element_detail
  const programmeCodeToProviderCode = mapToProviders([programmeCode])[0]
  const { latestAttainmentDates, thesisData } = findThesisAndLatestAttainments(student, programmeCodeToProviderCode)
  const studyTrack = studyrightElements?.find(element => element?.element_detail.type === 30)?.element_detail

  return {
    student: { studentNumber, name, sis_person_id, email, phoneNumber, secondaryEmail },
    startOfStudyright,
    thesisInfo: thesisData
      ? {
          grade: thesisData.grade,
          attainmentDate: thesisData.attainment_date,
          courseCode: thesisData.course.code,
        }
      : null,
    programme: {
      code: programme?.code,
      name: programme?.name,
      studyTrack,
    },
    latestAttainmentDates,
    credits: {
      hops: student.studyplans[0].completed_credits,
      all: student.creditcount,
    },
  }
}

const findStudentsCloseToGraduation = async () =>
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
      include: [
        {
          model: Studyplan,
          attributes: ['completed_credits', 'included_courses', 'programme_code'],
          where: {
            completed_credits: {
              [Op.gte]: 160,
            },
            programme_code: {
              [Op.like]: 'KH%',
            },
          },
          include: [
            {
              model: Studyright,
              attributes: ['startdate', 'studyrightid'],
              where: {
                graduated: 0,
                cancelled: false,
              },
              include: [
                {
                  model: StudyrightElement,
                  attributes: ['code'],
                  include: [
                    {
                      model: ElementDetail,
                      attributes: ['code', 'name', 'type'],
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
  ).map(student => formatStudent(student.toJSON()))

const getCloseToGraduationData = async () => {
  const dataOnRedis = await redisClient.getAsync(CLOSE_TO_GRADUATION_REDIS_KEY)
  if (dataOnRedis) return JSON.parse(dataOnRedis)
  const freshData = await findStudentsCloseToGraduation()
  redisClient.setAsync(CLOSE_TO_GRADUATION_REDIS_KEY, JSON.stringify(freshData))
  return freshData
}

module.exports = {
  findStudentsCloseToGraduation,
  getCloseToGraduationData,
  CLOSE_TO_GRADUATION_REDIS_KEY,
}
