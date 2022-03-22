/* eslint no-console: 0 */

/*
  depends on nodeproxy running in importer.cs.helsinki.fi, and env RAPO_NODEPROXY (see importer for a proper value)
  needs also acces to importer db api, uses env IMPORTER_API

  known differences in APIs
    - rapo does not show students that have graduated
    - rapo does not handle the starting year of transfers properly (shows in old staring population)
    - rapo show some students incorrectly passive, see https://github.com/UniversityOfHelsinkiCS/oodikone/issues/3521
*/

const axios = require('axios').default

const _ = require('lodash')

const { optimizedStatisticsOf } = require('./services/populations')
const { Student, Transfer } = require('./models')

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

const isAcuallyActive = async student => {
  const currentSemester = 144
  const tokenImporterApi = process.env.IMPORTER_API

  const url = `https://importer.cs.helsinki.fi/api/importer/students/${student}/rapo_semester_enrollments?token=${tokenImporterApi}`
  const { data } = await axios.get(url)
  const terms = data.reduce((all, s) => all.concat(s.terms), []).filter(t => t.semester_code === currentSemester)
  const active = terms.filter(t => t.type !== 'NEGLECTED')
  return active.length > 0
}

const hasTransferred = async (student, programme) => {
  const data = await Student.findByPk(student, {
    include: [
      {
        model: Transfer,
      },
    ],
  })

  const transferTo = data.transfers.find(t => t.targetcode === programme)
  return transferTo !== undefined
}

const programme_diff_year = async (programme, facultyCode, year, brief = false) => {
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

  const wrongInRapo = []
  for (let student of onlyInOodikone) {
    const status = await isAcuallyActive(student)
    if (status) {
      wrongInRapo.push(student)
    }
  }

  const transferred = []
  for (let student of onlyInRapo) {
    const status = await hasTransferred(student, programme)
    if (status) {
      transferred.push(student)
    }
  }

  const checkOodikoneOnly = _.difference(onlyInOodikone, wrongInRapo)
  const checkRapoOnly = _.difference(onlyInOodikone, wrongInRapo)

  console.log('vuosi', year)

  if (!brief) {
    console.log('')
    console.log('oodikone', oodikoneStudents.length, ' transferred', transferred.length)
    console.log('rapo', rapoStudents.length, ' activeness wrong rapo', wrongInRapo.length)
    console.log('only rapo', checkRapoOnly.length)
    console.log('only oodikone', checkOodikoneOnly.length)

    console.log('')

    if (checkRapoOnly.length > 0) {
      console.log('Only in Rapo:')
      console.log(checkRapoOnly.join('\n'))
    }

    if (checkOodikoneOnly.length > 0) {
      console.log('Only in Oodikone:')
      console.log(checkOodikoneOnly.join('\n'))
    }
  }

  if (checkRapoOnly.length + checkOodikoneOnly.length) {
    console.log('******************************************************')
  }

  if (!brief) {
    console.log('')
  }
}

const programme_diff = async (programme, faculty, brief) => {
  console.log('\n', programme)
  console.log('--------', '\n')

  await programme_diff_year(programme, faculty, 2017, brief)
  await programme_diff_year(programme, faculty, 2018, brief)
  await programme_diff_year(programme, faculty, 2019, brief)
  await programme_diff_year(programme, faculty, 2020, brief)
  await programme_diff_year(programme, faculty, 2021, brief)
}

const faculty_diff = async (faculty, programmes, brief) => {
  console.log('\n', faculty)
  console.log('==')
  for (let programme of programmes) {
    await programme_diff(programme, faculty, brief)
  }
}

const priogrammes_of_faculties = {
  H10: ['KH10_001'],
  H20: ['KH20_001'],
  H30: ['KH30_001', 'KH30_002'],
  H40: ['KH40_001', 'KH40_002', 'KH40_003', 'KH40_004', 'KH40_005', 'KH40_006'],
  H50: ['KH50_001', 'KH50_002', 'KH50_003', 'KH50_004', 'KH50_005', 'KH50_006', 'KH50_007', 'KH50_008'],
  H55: ['KH55_001'],
  H60: ['KH60_001'],
  H70: ['KH70_001', 'KH70_002', 'KH70_003', 'KH70_004'],
  H74: ['KH74_001'],
  H80: ['KH80_001', 'KH80_002', 'KH80_003', 'KH80_004'],
  H90: ['KH90_001'],
}

const main = async () => {
  for (let faculty of Object.keys(priogrammes_of_faculties)) {
    await faculty_diff(faculty, priogrammes_of_faculties[faculty], true)
  }
}

main().then(() => process.exit(0))
