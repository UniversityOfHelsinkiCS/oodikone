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

const formatStudent = student => {
  const { studyright_elements: studyrightElements, startdate: startOfStudyright } = student.studyplans[0].studyright
  const programmeCode = student.studyplans[0].programme_code
  const programme = studyrightElements?.find(programme => programme.code === programmeCode)?.element_detail
  const programmeCodeToProviderCode = mapToProviders([programmeCode])[0]
  const thesisData = student.credits.find(credit =>
    credit.course.organizations.some(org => org.code === programmeCodeToProviderCode)
  )

  return {
    student: {
      studentNumber: student.studentnumber,
      name: student.abbreviatedname,
      sis_person_id: student.sis_person_id,
    },
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
    },
    credits: {
      hops: student.studyplans[0].completed_credits,
      all: student.creditcount,
    },
  }
}

const findStudentsCloseToGraduation = async () =>
  (
    await Student.findAll({
      attributes: ['abbreviatedname', 'creditcount', 'sis_person_id', 'studentnumber'],
      include: [
        {
          model: Studyplan,
          attributes: ['completed_credits', 'programme_code'],
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
                      where: {
                        type: 20,
                      },
                      attributes: ['code', 'name'],
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
          required: false,
          where: {
            credittypecode: 4,
          },
          include: {
            model: Course,
            attributes: ['code'],
            where: {
              course_unit_type: 'urn:code:course-unit-type:bachelors-thesis',
            },
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
