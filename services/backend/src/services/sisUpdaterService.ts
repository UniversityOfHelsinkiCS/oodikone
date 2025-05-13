import axios from 'axios'
import { Op } from 'sequelize'

import { SECRET_TOKEN, SIS_UPDATER_URL } from '../config'
import { StudyplanModel } from '../models'

const client = axios.create({ baseURL: SIS_UPDATER_URL })
const params = { params: { token: SECRET_TOKEN } }

export const abortUpdate = async () => {
  const response = await client.get('/v1/abort', params)
  return response.data?.message
}

export const updateSISCoursesByCourseCode = async (coursecodes: string[]) => {
  const data = { coursecodes }
  const response = await client.post('/v1/courses', data, params)
  return response.data
}

export const updateSISMetadata = async () => {
  const response = await client.get('/v1/meta', params)
  return response.data
}

export const updateSISProgrammes = async () => {
  const response = await client.get('/v1/programmes', params)
  return response.data
}

export const updateSISRedisCache = async () => {
  const response = await client.get('/v1/rediscache', params)
  return response.data
}

export const updateSISStudents = async () => {
  const response = await client.get('/v1/students', params)
  return response.data
}

export const updateSISStudentsByStudentNumber = async (studentnumbers: string[]) => {
  const data = { studentnumbers }
  const response = await client.post('/v1/students', data, params)
  return response.data
}

export const updateSISStudyPlans = async (days: number) => {
  const limitDate = new Date()
  limitDate.setDate(limitDate.getDate() - days)
  const result = await StudyplanModel.findAll({
    where: { updatedAt: { [Op.lte]: limitDate } },
    attributes: ['studentnumber'],
    raw: true,
    limit: 1000,
  })
  const studentnumbers = result.map(r => r.studentnumber)
  const response = await client.post('v1/studyplans', { studentnumbers }, params)
  return response.data
}
