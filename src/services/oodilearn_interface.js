const axios = require('axios')
const https = require('https')
const { OODILEARN_URL } = require('../conf-backend')

const instance = axios.create({
  baseURL: OODILEARN_URL,
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
})

const ping = () => instance.get('/ping')

const getStudentData = studentnumber => instance.get(`/student/${studentnumber}`) 

const getStudents = async numbers => {
  const datas = await Promise.all(numbers.map(async (studentnumber) => {
    const { data } = await getStudentData(studentnumber)
    return { studentnumber, data }
  }))
  const students = {}
  datas.forEach(({ studentnumber, data }) => {
    students[studentnumber] = data
  })
  return students
}

module.exports = {
  ping,
  getStudentData,
  getStudents
}