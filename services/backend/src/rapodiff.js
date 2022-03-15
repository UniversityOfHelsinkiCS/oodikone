/* eslint no-console: 0 */

// depends on nodeproxy running in importer.cs.helsinki.fi, and env RAPO_NODEPROXY (see importer for a proper value)

const axios = require('axios').default

const _ = require('lodash')

const { optimizedStatisticsOf } = require('./services/populations')

const token = process.env.RAPO_NODEPROXY

const getFromRapo = async (urlStart, urlEnd) => {
  const { data: rapoStuffLasna } = await axios.get(urlStart)
  const { data: rapoStuffLasnaMinus } = await axios.get(urlEnd)

  const rapoStudents = _.difference(
    rapoStuffLasna.map(s => s.opiskelijanumero),
    rapoStuffLasnaMinus.map(s => s.opiskelijanumero)
  )

  return rapoStudents
}

const getFromOodikone = async (programme, year) => {
  const theStudyright = student => {
    const theOne = s => s.studyright_elements.find(e => e.code === programme)
    return student.studyrights.find(theOne)
  }

  const notGraduated = student => {
    const right = theStudyright(student)
    return right.graduated !== 1
  }

  const notTransferred = student => {
    const transfer = student.transfers.find(t => t.targetcode === programme)
    return transfer === undefined
  }

  const months = 12

  const oodikoneQuery = {
    semesters: ['FALL', 'SPRING'],
    months,
    studyRights: { programme },
    year,
  }

  const oodikoneStuff = (await optimizedStatisticsOf(oodikoneQuery)).students

  return oodikoneStuff
    .filter(notGraduated)
    .filter(notTransferred)
    .map(s => s.studentNumber)
}

const programme_diff = async (programme, facultyCode, year) => {
  const oodikoneStudents = await getFromOodikone(programme, year)

  const studyrightStartDate = `${year}-08-01`
  const studyrightEndDate = `${year + 1}-08-01`

  const rapoUrlStart = presence =>
    encodeURI(
      `https://importer.cs.helsinki.fi/test/rapo/${facultyCode}/${programme}/${studyrightStartDate}/${presence}?token=${token}`
    )
  const rapoUrlEnd = presence =>
    encodeURI(
      `https://importer.cs.helsinki.fi/test/rapo/${facultyCode}/${programme}/${studyrightEndDate}/${presence}?token=${token}`
    )

  const rapoStudentsLasna = await getFromRapo(rapoUrlStart('Läsnä'), rapoUrlEnd('Läsnä'))
  const rapoStudentsPoissa = await getFromRapo(rapoUrlStart('Poissa'), rapoUrlEnd('Poissa'))
  const rapoStudentPoissaLaki = await getFromRapo(
    rapoUrlStart('Poissa ei kuluta opintoaikaa'),
    rapoUrlEnd('Poissa ei kuluta opintoaikaa')
  )

  const rapoStudents = rapoStudentsLasna.concat(rapoStudentsPoissa).concat(rapoStudentPoissaLaki)

  const onlyInOodikone = _.difference(oodikoneStudents, rapoStudents)
  const onlyInRapo = _.difference(rapoStudents, oodikoneStudents)

  console.log('vuosi', year)

  console.log('')
  console.log('oodikone', oodikoneStudents.length)
  console.log('rapo', rapoStudents.length)
  console.log('only oodikone', onlyInOodikone.length)
  console.log('only rapo', onlyInRapo.length)
  console.log('')
  /*
  console.log('Only in Oodikone:')
  console.log(onlyInOodikone.join('\n'))
  console.log('Only in Rapo:')
  console.log(onlyInRapo.join('\n'))
  console.log('')
  */
}

const main = async () => {
  await programme_diff('KH50_005', 'H50', 2017)
  console.log(' ')
  await programme_diff('KH50_005', 'H50', 2018)
  console.log(' ')
  await programme_diff('KH50_005', 'H50', 2019)
  console.log(' ')
  await programme_diff('KH50_005', 'H50', 2020)
  console.log(' ')
  await programme_diff('KH50_005', 'H50', 2021)
  console.log(' ')
}

main().then(() => process.exit(0))
