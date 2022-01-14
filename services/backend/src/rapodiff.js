/* eslint no-console: 0 */

// script needs rapo certs, so you need to run this in production pannu
//
// possible workflows:
// - go to oodikone pannu, then "docker exec -it backend sh", then run this script with "npm
// run rapodiff". Modify with vim / nano until you're happy, then copy changes to local version and commit.
// - or bind mount a file to backend container in pannu, overriding this file. Modify that file
// inside or outside container, however you want. Keep file in pannu, or put it to pannu's git repo (oodikone-server-setup).

const axios = require('axios').default
const fs = require('fs')
const https = require('https')
const _ = require('lodash')

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

  const rapoUrl = encodeURI(
    `studyrights?faculty=${facultyCode}&presence=${presence}&education=${programme}&studyrightStartDate=${studyrightStartDate}`
  )

  const { data: rapoStuff } = await api.get(rapoUrl)
  const rapoStudents = rapoStuff.map(s => s.opiskelijanumero)

  const onlyInOodikone = _.difference(oodikoneStudents, rapoStudents)
  const onlyInRapo = _.difference(rapoStudents, oodikoneStudents)

  console.log('Only in Oodikone:', onlyInOodikone)
  console.log('Only in Rapo:', onlyInRapo)
}

main().then(() => process.exit(0))
