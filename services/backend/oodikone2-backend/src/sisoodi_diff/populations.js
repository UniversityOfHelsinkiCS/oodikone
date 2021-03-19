const _ = require('lodash')
const populationsSis = require('../servicesV2/populations')
const populationsOodi = require('../services/populations')
const { Studyright, StudyrightElement, Transfers } = require('../models')
const { Studyright: SISStudyright, StudyrightElement: SISStudyrightElement  } = require('../modelsV2')
const { Op } = require('sequelize')

let verbose = false

/* 
  if a number under 'sis' it is found in sis-oodikone but missing form
  oodi-oodikone due to a oodi-oodikone fukap
*/

const ignores = {
  'KH40_001': {
    '2020': {
      'oodi': ['014290314'] // studyright enddate wrong in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
    }
  },
  'KH40_002': {
    '2020': {
      'sis': ['011368870'] // studyright enddate missing in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
    }
  },
  'KH40_003': {
    '2020': {
      'sis': ['015340182'] // studyright enddate missing in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
    }
  },
  'KH40_004': {
    '2017': {
      'oodi': ['011531500'] // studyright enddate too early in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
    }
  },
  'KH40_005': {
    '2018': {
      'sis': ['014650093'] // graduated but mistakenlu luop in oodi https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
    }
  },
  'KH50_004': {
    '2020': {
      'oodi': ['013881465'] // studyright enddate too early in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
    }
  },
  'KH74_001': {
    '2019': {
      'sis': ['014480768'] // graduation missing in oodi https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2705
    }
  },
  'KH57_002': {
    '2017': {
      'oodi': ['014818220'] // UPDATER FUKAP graduation missing in sis-oodikone https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2705
    }
  },
  'KH90_001': {
    '2020': {
      'sis': ['014261181'] // UPDATER FUKAP many things wrong... https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2707
    }
  },
  'KH55_001': {
    '2019': {
      'sis': ['015160142'] // UPDATER FUKAP duplicate studyrigth https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2709
    }
  },
  'KH57_001': {
    '2018': {
      'sis': ['013296128'] // leagally missing... do not remember why
    }
  }
}

const populationDiff = async (programme, year) => {
  const months = Number((2020 - Number(year)) * 12 + 7)

  const query = {
    semesters: ['FALL', 'SPRING'],
    months,
    studyRights: { programme },
    year
  }

  const resultSis = await populationsSis.optimizedStatisticsOf(query)
  const resultOodi = await populationsOodi.optimizedStatisticsOf(query)

  const studentsSis = resultSis.students.map(s => s.studentNumber)
  const studentsOodi = resultOodi.students.map(s => s.studentNumber)

  let sisOnly = _.difference(studentsSis, studentsOodi)
  let oodiOnly = _.difference(studentsOodi, studentsSis)

  if (ignores[programme] && ignores[programme][year] ) {
    
    const legallyInSisButNotInOodi = ignores[programme][year]['sis']
    if ( legallyInSisButNotInOodi ) {
      sisOnly = _.difference(sisOnly, legallyInSisButNotInOodi)
    }

    const inOodiNotInSis = ignores[programme][year]['oodi']
    if ( inOodiNotInSis ) {
      oodiOnly = _.difference(oodiOnly, inOodiNotInSis)
    }
  }

  const both = _.intersection(studentsOodi, studentsSis)

  if (oodiOnly.length === 0 && sisOnly.length === 0) return

  // Report results and possible causes
  console.log('=== Year ', year, ', total both: ', both.length, ' ===')

  if (oodiOnly.length > 0) {
    console.log(`${oodiOnly.length} only in oodi, of which...`)

    const weirds = await weirdInSIS(oodiOnly, resultOodi, programme)

    if (weirds.cancelledstudents.length > 0) {
      console.log(`${weirds.cancelledstudents.length} marked as cancelled in sis, but oodi enddate is 2021-07-31`)
      if (verbose) {
        weirds.cancelledstudents.forEach(s => {
          console.log(s.studentStudentnumber, " / cancelled: ", s.canceldate, 
                      " / enddate: ", s.enddate)
        })
      }
    }

    if (weirds.transferredInPakkoSiirto.length > 0) {
      console.log(`${weirds.transferredInPakkoSiirto.length} not at all in sis programme and were transferred in pakkosiirto 2020-12-17`)
      if (verbose) weirds.transferredInPakkoSiirto.forEach(s => { console.log(s) })
    }

    if (weirds.notInProgramme.length > 0) {
      console.log(`${weirds.notInProgramme.length} not at all in sis programme for some reason`)
      if (verbose) weirds.notInProgramme.forEach(s => { console.log(s) })
    }

    const oodiNoWeirds = _.difference(oodiOnly,
      [...weirds.cancelledstudents.map(sn => sn.studentStudentnumber), 
       ...weirds.notInProgramme, ...weirds.transferredInPakkoSiirto]
    )

    if (oodiNoWeirds.length > 0) {
      console.log(`${oodiNoWeirds.length} missing from sis for other reasons`)
      if (verbose) oodiNoWeirds.forEach(s => { console.log(s) })
    }
  }

  if (sisOnly.length > 0) {
    console.log(`${sisOnly.length} only in sis, of which...`)
    const wronglySetCancel = (await cancelledButGraduated(programme)).map(sn => sn.studentStudentnumber)

    if (wronglySetCancel.length > 0) {
      console.log(`${wronglySetCancel.length} marked with wrong cancel date in oodi`)
      if (verbose) wronglySetCancel.forEach(s => { console.log(s) })
    }

    const remaining = _.difference(wronglySetCancel, sisOnly)

    if (remaining.length > 0) {
      console.log(`${remaining.length} missing from oodi for other reasons`)
      if (verbose) remaining.forEach(s => { console.log(s) })
    }
  }
}

const programmeDiff = async programme => {
  console.log('====== ', programme, ' ======')
  const years = ['2017', '2018', '2019', '2020']
  for (const year of years ) {
    await populationDiff(programme, year)
    console.log('')
  }
}

const cancelledButGraduated = async code => {
  const wrong = await Studyright.findAll({
    where: {
      graduated: 1,
      canceldate: {
        [Op.ne]: null
      }
    },
    include: {
      model: StudyrightElement,
      required: true,
      where: { code }
    }
  })

  return wrong
}

const weirdInSIS = async (oodiOnly, resultOodi, code) => {

  const findCorrectOodiStudyRight = (studyrights) => (
    studyrights.filter(sr => 
      sr.studyright_elements.some(elem => elem.code === code)
    )[0]
  )

  const oodiRights = resultOodi.students
                      .filter(s => oodiOnly.includes(s.studentNumber))
                      .reduce((acc, curr) => (
                        {...acc,
                          [curr.studentNumber]: findCorrectOodiStudyRight(curr.studyrights)
                        }
                      ), {})

  const sisRights = await SISStudyright.findAll({
    where: {
      student_studentnumber: {
        [Op.in]: oodiOnly
      }
    },
    include: {
      model: SISStudyrightElement,
      required: true,
      where: { code }
    }
  }).reduce((acc, curr) => (
      {...acc,
        [curr.studentStudentnumber]: curr
      }
    ), {})

  const oodiEndDate = new Date('2021-07-30T21:00:00.000Z')
  const cancelledstudents = oodiOnly.filter(sn =>
      new Date(oodiRights[sn].enddate).getTime() === oodiEndDate.getTime() &&
      sisRights[sn] && sisRights[sn].canceldate
  ).map(sn => ( sisRights[sn] ))

  const notInProgramme = oodiOnly.filter(sn => !sisRights[sn])

  const transferredInPakkoSiirto = await Transfers.findAll({
    attributes: ['studentnumber'],
    where: {
      targetcode: code,
      transferdate: {
        [Op.eq]: new Date('2020-12-17T22:00:00.000Z')
      },
      studentnumber: {
        [Op.in]: notInProgramme
      }
    },
      raw: true
    }).map(s => s.studentnumber)

  return {
    cancelledstudents,
    notInProgramme: _.difference(notInProgramme, transferredInPakkoSiirto),
    transferredInPakkoSiirto
  }
}


const masterCodes = async () => {
  return (await StudyrightElement.findAll({
    attributes: ['code'],
    where: {
      code: {
        [Op.like]: 'MH%'
      }
    },
    group: ['code'],
    order: ['code']
  })).map(s => s.code)
}

const bscCodes = async () => {
  return (await StudyrightElement.findAll({
    attributes: ['code'],
    where: {
      code: {
        [Op.like]: 'KH%'
      }
    },
    group: ['code'],
    order: ['code']
  })).map(s => s.code)
}


const msc = async () => {
  const programmes = await masterCodes()
  for (let programme of programmes) {
    await programmeDiff(programme)
  }
}

const bsc = async () => {
  const programmes = await bscCodes()
  for (let programme of programmes) {
    await programmeDiff(programme)
  }
}

const bscnok = async () => {
  let programmes = await bscCodes()
  for (let programme of _.difference(programmes, ['KH60_001'])) {
    await programmeDiff(programme)
  }
}



const main = async () => {
  // print moar/less
  verbose = true

  const what = process.argv.slice(2)

  if (process.argv.length === 2) {
    await programmeDiff('KH20_001')
    process.exit()
  }

  if (what.includes('msc')) {
    await msc()
  }

  if (what.includes('bsc')) {
    await bsc()
  }

  if (what.includes('bscnok')) {
    await bscnok()
  }

  for ( let i=0; i < what.length; i++ ) {
    const programme = what[i]
    if ( programme.startsWith('KH') || programme.startsWith('MH') ) {
      await programmeDiff(programme)
    } 
  }

  process.exit()
}

main()

/* 
  how to run:
    docker exec backend node /usr/src/app/src/sisoodi_diff/populations.js

  or:
    npm run diff:populations KH10_001 KH20_001 KH50_005
    npm run diff:populations msc bsc

  in production:
    docker exec -it backend sh

    and then:

    npm run diff:populations KH10_001 KH20_001 KH50_005
*/
