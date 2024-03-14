/* eslint-disable no-console */

const axios = require('axios').default

const _ = require('lodash')

const { optimizedStatisticsOf } = require('../services/populations')
const { Student, Transfer, StudyrightElement, Studyright } = require('../models')
const { rapoToken, tokenImporterApi, importerDbApiUrl, nodeproxyUrl } = require('./conf')

const getFromRapo = async (urlStart, urlEnd) => {
  console.log({ urlStart, urlEnd })
  const { data: rapoStuffLasna } = await axios.get(urlStart)
  const { data: rapoStuffLasnaMinus } = await axios.get(urlEnd)

  const rapoStudents = _.difference(
    rapoStuffLasna.map(s => s.opiskelijanumero),
    rapoStuffLasnaMinus.map(s => s.opiskelijanumero)
  )

  return rapoStudents
}

const known_problems_in_oodikone = {
  KH30_001: ['013896191'],
  KH40_003: ['013200457'],
  KH55_001: ['013195834', '015119708', '015138336'],
}

const known_problems_in_rapo = {
  KH55_001: ['015160142', '015135575', '015119708', '015138336'],
}

const getFromOodikone = async (programme, year) => {
  const isNotAmongKnownProblems = student => {
    const hasProblems = known_problems_in_oodikone[programme] ? known_problems_in_oodikone[programme] : []
    return !hasProblems.includes(student.studentNumber)
  }

  const theStudyrights = student => {
    const theOne = s => s.studyright_elements.find(e => e.code === programme)
    // in some rare cases student may have more than one studyright for same programme
    return student.studyrights.filter(theOne)
  }

  const notGraduated = student => {
    const graduation = theStudyrights(student).filter(r => r.graduated === 1)
    return graduation.length === 0
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
    .filter(isNotAmongKnownProblems)
    .map(s => s.studentNumber)
}

const isAcuallyActive = async student => {
  const currentSemester = 144

  const url = `${importerDbApiUrl}/students/${student}/rapo_semester_enrollments?token=${tokenImporterApi}`
  const result = await axios.get(url)
  console.log('result:')
  console.log(result)
  const { data } = result
  const terms = data.reduce((all, s) => all.concat(s.terms), []).filter(t => t.semester_code === currentSemester)
  const active = terms.filter(t => t.type !== 'NEGLECTED')
  const negl = terms.filter(t => t.type === 'NEGLECTED')
  return active.length > 0 && negl.length > 0
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

const graduatedVeryRecently = async (student, programme) => {
  const data = await Student.findByPk(student, {
    include: [
      {
        model: Studyright,
        include: [
          {
            model: StudyrightElement,
            required: true,
            where: {
              code: programme,
            },
          },
        ],
        where: {
          graduated: 1,
        },
      },
    ],
  })

  if (!data || data.studyrights.length === 0) {
    return false
  }

  const graduated = new Date(data.studyrights[0].enddate)
  const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
  return graduated > weekAgo
}

const programme_diff_year = async (programme, facultyCode, year, brief = false) => {
  const oodikoneStudents = await getFromOodikone(programme, year)

  const studyrightStartDate = `${year}-08-01`
  const studyrightEndDate = `${year + 1}-08-01`

  const rapoUrlStart = presence =>
    encodeURI(
      `${nodeproxyUrl}/test/rapo/${facultyCode}/${programme}/${studyrightStartDate}/${presence}?token=${rapoToken}`
    )
  const rapoUrlEnd = presence =>
    encodeURI(
      `${nodeproxyUrl}/test/rapo/${facultyCode}/${programme}/${studyrightEndDate}/${presence}?token=${rapoToken}`
    )

  const rapoStudentsLasna = await getFromRapo(rapoUrlStart('Läsnä'), rapoUrlEnd('Läsnä'))
  const rapoStudentsPoissa = await getFromRapo(rapoUrlStart('Poissa'), rapoUrlEnd('Poissa'))
  const rapoStudentPoissaLaki = await getFromRapo(
    rapoUrlStart('Poissa ei kuluta opintoaikaa'),
    rapoUrlEnd('Poissa ei kuluta opintoaikaa')
  )

  const isNotAmongKnownProblems = student => {
    const hasProblems = known_problems_in_rapo[programme] ? known_problems_in_rapo[programme] : []
    return !hasProblems.includes(student.studentNumber)
  }

  const rapoStudents = rapoStudentsLasna
    .concat(rapoStudentsPoissa)
    .concat(rapoStudentPoissaLaki)
    .filter(isNotAmongKnownProblems)

  const onlyInOodikone = _.difference(oodikoneStudents, rapoStudents)
  const onlyInRapo = _.difference(rapoStudents, oodikoneStudents)

  const wrongMissingInRapo = []
  for (const student of onlyInOodikone) {
    const status = await isAcuallyActive(student)
    if (status) {
      wrongMissingInRapo.push(student)
    }
  }

  // these are in wrong RAPO-population
  const transferred = []
  for (const student of onlyInRapo) {
    const isTransfer = await hasTransferred(student, programme)
    if (isTransfer) {
      transferred.push(student)
    } else {
      const isRecentGraduation = await graduatedVeryRecently(student, programme)
      if (isRecentGraduation) {
        transferred.push(student)
      }
    }
  }

  const checkOodikoneOnly = _.difference(onlyInOodikone, wrongMissingInRapo)
  const checkRapoOnly = _.difference(onlyInRapo, transferred)

  if (!brief) {
    console.log('vuosi', year)
    console.log('')
    console.log('oodikone', oodikoneStudents.length, ' transferred', transferred.length)
    console.log('rapo', rapoStudents.length, ' activeness wrong rapo', wrongMissingInRapo.length)
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
    console.log('******************************', year)
    if (checkRapoOnly.length > 0) {
      console.log('Only in Rapo:')
      console.log(checkRapoOnly.join('\n'))
    }

    if (checkOodikoneOnly.length > 0) {
      console.log('Only in Oodikone:')
      console.log(checkOodikoneOnly.join('\n'))
    }
  }

  if (!brief) {
    console.log('')
  }
}

const programme_diff = async (programme, faculty, brief) => {
  console.log()
  console.log(programme)
  console.log('--------', '\n')

  await programme_diff_year(programme, faculty, 2017, brief)
  await programme_diff_year(programme, faculty, 2018, brief)
  await programme_diff_year(programme, faculty, 2019, brief)
  await programme_diff_year(programme, faculty, 2020, brief)
  await programme_diff_year(programme, faculty, 2021, brief)
}

const facultyDiff = async (faculty, programmes, brief) => {
  console.log('\n')
  console.log(faculty)
  console.log('==')
  for (const programme of programmes) {
    await programme_diff(programme, faculty, brief)
  }
}

// eslint-disable-next-line no-unused-vars
const msc_programme_diff_year = async (programme, facultyCode, year, brief = false) => {
  const oodikoneStudents = await getFromOodikone(programme, year)

  const studyrightStartDate = `${year}-08-01`
  const studyrightEndDate = `${year + 1}-08-01`

  const rapoUrlStart = presence =>
    encodeURI(
      `${nodeproxyUrl}/test/rapo/${facultyCode}/${programme}/${studyrightStartDate}/${presence}?token=${rapoToken}`
    )
  const rapoUrlEnd = presence =>
    encodeURI(
      `${nodeproxyUrl}/test/rapo/${facultyCode}/${programme}/${studyrightEndDate}/${presence}?token=${rapoToken}`
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
  for (const student of onlyInOodikone) {
    const status = await isAcuallyActive(student)
    if (status) {
      // wrongInRapo.push(student)
    }
  }

  // in wrong RAPO population
  const transferred = []
  for (const student of onlyInRapo) {
    const status = await hasTransferred(student, programme)
    if (status) {
      transferred.push(student)
    }
  }

  const checkOodikoneOnly = _.difference(onlyInOodikone, wrongInRapo)
  const checkRapoOnly = _.difference(onlyInRapo, transferred)
  const both = _.intersection(oodikoneStudents, rapoStudents)

  console.log('vuosi', year)

  if (!brief) {
    console.log('')
    console.log('oodikone', oodikoneStudents.length, ' transferred', transferred.length)
    console.log('rapo', rapoStudents.length, ' activeness wrong rapo', wrongInRapo.length)
    console.log('both', both.length)
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

module.exports = { facultyDiff }
