/* eslint no-console: 0 */

// depends on nodeproxy running in importer.cs.helsinki.fi, and env RAPO_NODEPROXY (see importer for a proper value)

const axios = require('axios').default

const _ = require('lodash')

const { optimizedStatisticsOf } = require('./services/populations')

const token = process.env.RAPO_NODEPROXY

const programme_diff = async (programme, facultyCode, year) => {
  const months = 12
  const studyrightStartDate = `${year}-08-01`

  const oodikoneQuery = {
    semesters: ['FALL', 'SPRING'],
    months,
    studyRights: { programme },
    year,
  }
  const rapoUrl = presence =>
    encodeURI(
      `https://importer.cs.helsinki.fi/test/rapo/${facultyCode}/${programme}/${studyrightStartDate}/${presence}?token=${token}`
    )

  const oodikoneStuff = await optimizedStatisticsOf(oodikoneQuery)
  const oodikoneStudents = oodikoneStuff.students.map(s => s.studentNumber)

  const { data: rapoStuffLasna } = await axios.get(rapoUrl('Läsnä'))
  const { data: rapoStuffPoissa } = await axios.get(rapoUrl('Poissa'))

  console.log(rapoStuffLasna.length, rapoStuffPoissa.length)

  const rapoStudents = rapoStuffLasna.map(s => s.opiskelijanumero).concat(rapoStuffPoissa.map(s => s.opiskelijanumero))

  console.log(rapoStudents.length, oodikoneStudents.length)

  const onlyInOodikone = _.difference(oodikoneStudents, rapoStudents)
  const onlyInRapo = _.difference(rapoStudents, oodikoneStudents)

  console.log('Only in Oodikone:', onlyInOodikone)
  console.log('Only in Rapo:', onlyInRapo)
}

const main = async () => {
  await programme_diff('KH50_005', 'H50', 2021)
}

main().then(() => process.exit(0))
