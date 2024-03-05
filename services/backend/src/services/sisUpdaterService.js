const axios = require('axios')
const { SIS_UPDATER_URL, SECRET_TOKEN } = require('../conf-backend')
const { Studyplan, Student, StudyrightElement } = require('../models')
const { Op } = require('sequelize')
const logger = require('../util/logger')

const client = axios.create({ baseURL: SIS_UPDATER_URL })

const params = { params: { token: SECRET_TOKEN } }

const updateSISStudents = async () => {
  const response = await client.get('/v1/students', params)
  return response.data
}

const updateStudentsByStudentNumber = async studentnumbers => {
  const data = { studentnumbers }
  const response = await client.post('/v1/students', data, params)
  return response.data
}

const updateCoursesByCourseCode = async coursecodes => {
  const data = { coursecodes }
  const response = await client.post('/v1/courses', data, params)
  return response.data
}

const updateSISMetadata = async () => {
  const response = await client.get('/v1/meta', params)
  return response.data
}

const updateSISProgrammes = async () => {
  const response = await client.get('/v1/programmes', params)
  return response.data
}

const updateSISRedisCache = async () => {
  const response = await client.get('/v1/rediscache', params)
  return response.data
}
const delay = time => {
  return new Promise(res => {
    setTimeout(res, time)
  })
}

const updateStudentsIndividually = async () => {
  try {
    const studentNumbers = await Student.findAll({
      attributes: ['studentnumber'],
      include: {
        model: StudyrightElement,
        where: {
          code: { [Op.regexp]: '(KH*|MH*)' },
        },
      },
    })
    const uniqueStudents = [...new Set(studentNumbers.map(s => s.studentnumber))]
    const chunkSize = 1000
    for (let from = 0; from < uniqueStudents.length - chunkSize; from += chunkSize) {
      await client.post(
        'v1/students',
        { studentnumbers: uniqueStudents.slice(from, from + chunkSize), individualMode: true },
        params
      )
      await delay(200)
    }
  } catch (e) {
    logger.error(e)
  }
}

const studyplansUpdate = async days => {
  const limitDate = new Date()
  limitDate.setDate(limitDate.getDate() - days)
  const result = await Studyplan.findAll({
    where: { updatedAt: { [Op.lte]: limitDate } },
    attributes: ['studentnumber'],
    raw: true,
    limit: 1000,
  })
  const studentnumbers = result.map(r => r.studentnumber)
  const response = await client.post('v1/studyplans', { studentnumbers }, params)
  return response.data
}

const abort = async () => {
  const response = await client.get('/v1/abort', params)
  return response.data
}

module.exports = {
  updateSISMetadata,
  updateSISStudents,
  updateSISProgrammes,
  updateStudentsByStudentNumber,
  updateSISRedisCache,
  abort,
  updateCoursesByCourseCode,
  studyplansUpdate,
  updateStudentsIndividually,
}
