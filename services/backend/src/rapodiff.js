/* eslint no-console: 0 */

const axios = require('axios').default
const fs = require('fs')
const https = require('https')

const { optimizedStatisticsOf } = require('./services/populations')

const { RAPO_CERT_PATH, RAPO_KEY_PATH, RAPO_API_KEY } = process.env

const agent = new https.Agent({
  cert: fs.readFileSync(RAPO_CERT_PATH, 'utf8'),
  key: fs.readFileSync(RAPO_KEY_PATH, 'utf8'),
})

const api = axios.create({
  baseURL: 'https://gw.api.helsinki.fi/secure/rapo/report/',
  headers: { 'X-Api-Key': RAPO_API_KEY },
  httpsAgent: agent,
})

const main = async () => {
  const facultyCode = 'H50'
  const programme = 'KH50_005'
  const studyrightStartDate = '2020-08-01'
  const presence = 'LÄSNÄOLEVA'

  const months = 12 // some amount of months, dunno
  const year = 2020

  const oodikoneQuery = {
    semesters: ['FALL', 'SPRING'],
    months,
    studyRights: { programme },
    year,
  }

  const oodikoneStuff = await optimizedStatisticsOf(oodikoneQuery)
  const oodikoneStudents = oodikoneStuff.students.map(s => s.studentNumber)

  const { data: rapoStuff } = await api.get(
    `studyrights?faculty=${facultyCode}&presence=${presence}&education=${programme}&studyrightStartDate=${studyrightStartDate}`
  )

  console.log('=== RAPOSTUFF ===')
  console.log(JSON.stringify(rapoStuff, null, 2))

  console.log('=== OODIKONE ===')
  console.log(JSON.stringify(oodikoneStuff, null, 2))
  console.log(JSON.stringify(oodikoneStudents, null, 2))
}

main()
