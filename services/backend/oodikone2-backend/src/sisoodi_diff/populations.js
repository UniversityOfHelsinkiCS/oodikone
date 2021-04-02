/* eslint-disable */

const _ = require('lodash')
const populationsSis = require('../servicesV2/populations')
const populationsOodi = require('../services/populations')
const { Studyright, StudyrightElement, Transfers } = require('../models')
const { Studyright: SISStudyright, StudyrightElement: SISStudyrightElement } = require('../modelsV2')
const { Op } = require('sequelize')

let verbose = false
let printAll = false
let allfakd = []

/* 
  if a number under 'sis' it is found in sis-oodikone but missing form
  oodi-oodikone due to a oodi-oodikone fukap
*/

const ignores = {
  KH40_001: {
    2020: {
      oodi: ['014290314'] // Oodissa on virhe opintoajan pituuden laskussa. Tämä on tullut äskettäin ilmi. Sisussa on siis oikeat tiedot.
    }
  },
  KH40_002: {
    2020: {
      sis: ['011368870'] // studyright enddate missing in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
    }
  },
  KH40_003: {
    2020: {
      sis: ['015340182'] // studyright enddate missing in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
    }
  },
  KH40_005: {
    2018: {
      sis: ['014650093'] // on tosiaan vähän ristiriitaiset tiedot Oodissa. Sisussa näkyy kuitenkin ok, niin että annetaan olla
    }
  },
  KH50_004: {
    2020: {
      oodi: ['013881465'] // studyright enddate too early in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
    }
  },
  KH74_001: {
    2019: {
      sis: ['014480768'] // graduation missing in oodi https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2705
    }
  },
  KH57_002: {
    2017: {
      oodi: ['014818220'] // graduation missing in sis-oodikone due to sis prblm https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2705
    }
  },
  KH90_001: {
    2020: {
      sis: ['014261181'] // UPDATER FUKAP many things wrong... https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2707
    }
  },
  KH55_001: {
    2019: {
      sis: ['015160142'] // UPDATER FUKAP duplicate studyrigth https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2709
    }
  },
  KH57_001: {
    2018: {
      sis: ['013296128'] // leagally missing... do not remember why
    }
  },
  KH60_001: {
    2017: {
      oodi: [
        // varhaiskasvatus https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2738
        '013299358',
        '014720169',
        '014711262',
        '014721825',
        '014528934',
        '014659133'
      ]
    },
    2018: {
      // varhaiskasvatus https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2738
      oodi: ['014726105', '014708699', '014732623', '014728983', '014323074', '014624977']
    },
    2019: {
      // varhaiskasvatus https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2738
      oodi: ['014366086', '014731909', '014734511']
    },
    2020: {
      // varhaiskasvatus https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2738
      oodi: ['013466013', '014590027', '014340963', '014179998', '013743299', '013758239', '014590807']
    }
  },
  // there are many inconsistencies in masters, so they're grouped by the reason, not
  // by program for now
  MH_ALL: {
    // highly likely sis fakap:
    // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2723
    missingAcceptedPath: [
      '014044463',
      '014387887',
      '014472417',
      '014472475',
      '014946914',
      '014839694',
      '014747773',
      '014808311',
      '014874730',
      '014917354',
      '014919585',
      '014586293',
      '014728857',
      '014735921',
      '014729610',
      '014736823',
      '014748442',
      '014810244',
      '014817108',
      '014819436',
      '014923115',
      '014723645',
      '014816950',
      '014928806',
      '014370386',
      '014566695',
      '014731792',
      '014620081',
      '014807781',
      '014719400',
      '014745733',
      '014816141',
      '014861536',
      '014841158',
      '014488922',
      '014671797',
      '014808816',
      '014818220',
      '014822614',
      '014817852',
      '014835889',
      '014819614',
      '014772612',
      '014810668'
    ]
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

  // filter out bach bugs we already know
  if (ignores[programme] && ignores[programme][year]) {
    const legallyInSisButNotInOodi = ignores[programme][year]['sis']
    if (legallyInSisButNotInOodi) {
      sisOnly = _.difference(sisOnly, legallyInSisButNotInOodi)
    }

    const inOodiNotInSis = ignores[programme][year]['oodi']
    if (inOodiNotInSis) {
      oodiOnly = _.difference(oodiOnly, inOodiNotInSis)
    }
  }

  // filter out master bugs we already know
  oodiOnly = _.difference(oodiOnly, ignores.MH_ALL.missingAcceptedPath)

  const both = _.intersection(studentsOodi, studentsSis)

  if (oodiOnly.length === 0 && sisOnly.length === 0) return

  if (printAll) {
    allfakd = [...allfakd, ...oodiOnly, ...sisOnly]
    return
  }

  // Report results and possible causes
  console.log('=== Year ', year, ', total both: ', both.length, ' ===')

  if (oodiOnly.length > 0) {
    console.log(`${oodiOnly.length} only in oodi, of which...`)

    const weirds = await weirdInSIS(oodiOnly, resultOodi, programme)
    const oodiNoWeirds = _.difference(oodiOnly, _.flatten(Object.values(weirds)))
    const weirdosTotalLength = Object.values(weirds).reduce((acc, curr) => acc + curr.length, 0)
    if (oodiOnly.length !== weirdosTotalLength + oodiNoWeirds.length) {
      console.log(
        `!!! oodiOnly length ${oodiOnly.length} doesn't match weirds (${weirdosTotalLength}) + no-weirds (${oodiNoWeirds.length}), check for bugs !!!`
      )
    }

    printWithReason(
      weirds.cancelledstudents,
      'marked as cancelled in sis, but oodi enddate is after sis canceldate. Also not transferred to this program.'
    )
    printWithReason(
      weirds.transferredInPakkoSiirto,
      'not at all in sis programme,  transferred in pakkosiirto 2020-12-17'
    )
    printWithReason(
      weirds.transferredAtSomeOtherDate,
      'not at all in sis programme, transferred at some date, not in pakkosiirto'
    )
    printWithReason(weirds.notInProgramme, 'not at all in sis programme for some reason')
    printWithReason(oodiNoWeirds, 'missing from sis for other reasons')
  }

  if (sisOnly.length > 0) {
    console.log(`${sisOnly.length} only in sis, of which...`)
    const wronglySetCancel = (await cancelledButGraduated(programme)).map(sn => sn.studentStudentnumber)
    const remaining = _.difference(sisOnly, wronglySetCancel)

    printWithReason(wronglySetCancel, 'marked with wrong cancel date in oodi')
    printWithReason(remaining, 'missing from sis for other reasons')
  }
  console.log('') // adding newline before next programme / year
}

const printWithReason = (studentnumbers, reason) => {
  if (studentnumbers.length > 0) {
    console.log(`- ${studentnumbers.length} ${reason}`)
    if (verbose)
      studentnumbers.forEach(s => {
        console.log(s)
      })
  }
}

const programmeDiff = async programme => {
  if (!printAll) {
    console.log('====== ', programme, ' ======')
  }
  const years = ['2017', '2018', '2019', '2020']
  for (const year of years) {
    await populationDiff(programme, year)
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
  const findCorrectOodiStudyRight = studyrights =>
    studyrights.filter(sr => sr.studyright_elements.some(elem => elem.code === code))[0]

  const oodiRights = resultOodi.students
    .filter(s => oodiOnly.includes(s.studentNumber))
    .reduce((acc, curr) => ({ ...acc, [curr.studentNumber]: findCorrectOodiStudyRight(curr.studyrights) }), {})

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
  }).reduce((acc, curr) => ({ ...acc, [curr.studentStudentnumber]: curr }), {})

  const notInSisProgramme = oodiOnly.filter(sn => !sisRights[sn])

  const transferredToThisProgramme = await Transfers.findAll({
    attributes: ['studentnumber', 'transferdate'],
    where: {
      targetcode: code,
      studentnumber: {
        [Op.in]: notInSisProgramme
      }
    },
    raw: true
  })

  let studentNumbersTransferredToThisProgramme = transferredToThisProgramme.map(s => s.studentnumber)

  const uniqStudentNumbersTransferredToThisProgramme = new Set(studentNumbersTransferredToThisProgramme)

  if (
    studentNumbersTransferredToThisProgramme.length !== uniqStudentNumbersTransferredToThisProgramme.size &&
    verbose
  ) {
    console.log('(note: Duplicates in oodi transfers, filtering for correct comparison results)')
    studentNumbersTransferredToThisProgramme = [...uniqStudentNumbersTransferredToThisProgramme]
  }

  const pakkoSiirtoDate = new Date('2020-12-17 22:00')
  const transferredInPakkoSiirto = transferredToThisProgramme
    .filter(t => new Date(t.transferdate).getTime() == pakkoSiirtoDate.getTime())
    .map(s => s.studentnumber)

  const transferredAtSomeOtherDate = _.difference(studentNumbersTransferredToThisProgramme, transferredInPakkoSiirto)

  const cancelledstudents = oodiOnly.filter(
    sn =>
      sisRights[sn] &&
      sisRights[sn].canceldate &&
      new Date(oodiRights[sn].enddate).getTime() > new Date(sisRights[sn].enddate).getTime() &&
      !uniqStudentNumbersTransferredToThisProgramme.has(sn)
  )

  return {
    cancelledstudents,
    transferredInPakkoSiirto,
    transferredAtSomeOtherDate,
    notInProgramme: _.difference(notInSisProgramme, studentNumbersTransferredToThisProgramme)
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

  if (what.includes('printall')) {
    printAll = true
    console.log('Getting information for all asked students first, then printing studentnumbers. Might take a while')
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

  for (let i = 0; i < what.length; i++) {
    const programme = what[i]
    if (programme.startsWith('printall')) continue
    if (programme.startsWith('KH') || programme.startsWith('MH')) {
      await programmeDiff(programme)
    }
  }
  if (printAll) {
    console.log('total amount: ', allfakd.length)
    allfakd.forEach(student => {
      console.log(student)
    })
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

  if you want just a list of all studentnumbers, e.g. to be run against updater, include
  'printall' in arguments. So:
    npm run diff:populations msc printall, or 
    npm run diff:populations KH10_001 KH20_001 KH50_005 printall
*/
