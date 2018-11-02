const axios = require('axios')
const https = require('https')
const { OODILEARN_URL } = require('../conf-backend')

const instance = axios.create({
  baseURL: OODILEARN_URL,
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
})

const ping = () => instance.get('/ping')

const getStudentData = studentnumber => instance.get(`/student/${studentnumber}`)

const getStudentsData = studentnumbers => instance.get('/students/',{ params: { 'student': studentnumbers } })

const getStudents = async numbers => {
  console.log(numbers)
  const request = await getStudentsData(numbers)
  const datas = request.data
  console.log(datas) // This is all cool
  // const datas = await Promise.all(numbers.map(async (studentnumber) => {
  //   const { data } = await getStudentsData(studentnumber)
  //   return { studentnumber, data }
  // }))
  const students = {} // this is not all cool
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