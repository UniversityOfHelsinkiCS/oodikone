import { Op } from 'sequelize'

import { Fetchios } from '@oodikone/shared/util/fetchios'
import { SECRET_TOKEN, SIS_UPDATER_URL } from '../config'
import { StudyplanModel } from '../models'

const client = Fetchios.create({
  baseUrl: SIS_UPDATER_URL,
  params: { token: SECRET_TOKEN ?? '' },
})

export const abortUpdate = async () => {
  const response = await client.get<{ message: string }>('/v1/abort', {})
  return response.data?.message
}

export const updateSISCoursesByCourseCode = async (coursecodes: string[]) => {
  const data = { coursecodes }
  const response = await client.post('/v1/courses', data, {})
  return response.data
}

export const updateSISMetadata = async () => {
  const response = await client.get('/v1/meta', {})
  return response.data
}

export const updateSISProgrammes = async () => {
  const response = await client.get('/v1/programmes', {})
  return response.data
}

export const updateSISRedisCache = async () => {
  const response = await client.get('/v1/rediscache', {})
  return response.data
}

export const updateSISStudents = async () => {
  const response = await client.get('/v1/students', {})
  return response.data
}

export const updateSISStudentsByStudentNumber = async (studentnumbers: string[]) => {
  const data = { studentnumbers }
  const response = await client.post('/v1/students', data, {})
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
  const response = await client.post('v1/studyplans', { studentnumbers }, {})
  return response.data
}
