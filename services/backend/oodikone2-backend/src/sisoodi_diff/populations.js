/* eslint-disable */

const _ = require('lodash')
const populationsSis = require('../servicesV2/populations')
const populationsOodi = require('../services/populations')
const { Studyright, StudyrightElement, Transfers } = require('../models')
const { Studyright: SISStudyright, StudyrightElement: SISStudyrightElement } = require('../modelsV2')
const { Op } = require('sequelize')

let verbose = false
/* 
  if a number under 'sis' it is found in sis-oodikone but missing form
  oodi-oodikone due to a oodi-oodikone fukap
*/

const ignores = {
  KH10_001: {
    2017: {
      oodi: ['014816167'] // on tohtoriopiskelija, mutta kandioikeus jätetty oodissa voimaan
    },
    2020: {
      oodi: ['011725361'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
    }
  },
  KH20_001: {
    2020: {
      sis: [
        '014472190',
        '014709698' // mistakenly missing from oodi-oodikone
      ]
    }
  },
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
  KH40_004: {
    2020: {
      sis: ['011516143'] // ei läsnä syksyllä, puuttuu ehkä siksi oodista?
    }
  },
  KH40_005: {
    2018: {
      sis: ['014650093'] // on tosiaan vähän ristiriitaiset tiedot Oodissa. Sisussa näkyy kuitenkin ok, niin että annetaan olla
    }
  },
  KH40_006: {
    2020: {
      oodi: ['013919638'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
    }
  },
  KH50_001: {
    2020: {
      oodi: ['013470384'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
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
    },
    2020: {
      sis: ['014614071', '013497370'] // missing from oodi-oodikone perhaps due to missing läsnäolo for suksy
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
        '014659133',
        '014845154' // studyright enddate too early in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2787
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
      oodi: [
        '013466013',
        '014590027',
        '014340963',
        '014179998',
        '013743299',
        '013758239',
        '014590807',
        '013495071' // studyright enddate too early in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2787
      ],
      sis: ['014734511'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2790 also a varhaiskasvatus issue
    }
  },
  MH10_001: {
    2020: {
      sis: ['012334670']
    }
  },
  MH40_009: {
    2020: {
      sis: ['010951408'],
      // varhaiskasvatus https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2738
      oodi: ['013466013', '014590027', '014340963', '014179998', '013743299', '013758239', '014590807']
    }
  },
  MH80_001: {
    2020: {
      oodi: ['014015735']
    }
  },
  MH20_001: {
    2020: {
      oodi: ['014582035'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2828
    }
  },
  MH20_002: {
    2018: {
      oodi: ['014846467'] // väärin oodi-oodikoneessa
    }
  },
  MH30_004: {
    2018: {
      oodi: ['011513023'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2828
    },
    2020: {
      oodi: ['012616631'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
    }
  },
  MH40_001: {
    2018: {
      sis: ['014486995'] // unknown oodi-oodikonefakap
    }
  },
  MH40_002: {
    2019: {
      oodi: ['014720114'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
    }
  },
  MH40_003: {
    2019: {
      sis: ['014444047'], // graduated but wrongly marked in oodi
      oodi: ['015100050'] // not cancelled in oodi even if it should have been,
    }
  },
  MH40_005: {
    2018: {
      oodi: ['014913549'], // not cancelled in oodi even if it should have been
      sis: ['014939002'] // graduated but wrongly marked in oodi
    },
    2019: {
      oodi: ['015095686'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
    },
    2020: {
      oodi: ['014736823'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2828
    }
  },
  MH40_006: {
    2018: {
      sis: ['014193880'] // graduated but wrongly marked in oodi
    }
  },
  MH40_008: {
    2020: {
      oodi: ['011516143'] // oodi-oodikone has masters selection despite it clearly should not have one
    }
  },
  MH40_010: {
    2019: {
      sis: ['014145812'] // graduated but wrongly marked in oodi
    }
  },
  MH40_012: {
    2018: {
      oodi: ['014148547'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2830
    }
  },
  MH40_014: {
    2017: {
      sis: ['014445428'] // graduated but wrongly marked in oodi
    },
    2020: {
      oodi: ['013349512'] //  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2831
    }
  },
  MH40_015: {
    2020: {
      oodi: ['014143791'] //  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2831
    }
  },
  // there are many inconsistencies in masters, so they're grouped by the reason, not
  // by program for now
  MH_ALL: {
    // in sis, but not in oodi
    sis: [
      // full-on oodikone fakap, no need to fix
      '014581611' // not in oodi-oodikone due to fukap
      // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2771
      //'013012234',
      // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2772
      //'014193880',
      // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2750
      //'012334670',
      //'010951408'
    ],
    // in oodi, but not in sis
    oodi: [
      // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2781
      '013878737',
      // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2749
      //'014724767',
      //'010947593',
      // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
      '014577749',
      '014724767'
    ]
  }
}

// For collecting all diff studentnumbers and printing them by reason
let allGrouped = {
  oodiOnly: {
    cancelledInSis: [],
    unknown: []
  },
  sisOnly: {
    cancelledInOodi: [],
    unknown: []
  }
}

const populationDiff = async (programme, year) => {
  const withProgramme = students => students.map(s => `${s}, ${programme}`)

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
  sisOnly = _.difference(sisOnly, ignores.MH_ALL.sis)
  oodiOnly = _.difference(oodiOnly, ignores.MH_ALL.oodi)

  if (oodiOnly.length === 0 && sisOnly.length === 0) return

  // Check for possible causes and group together

  console.log(year)

  if (oodiOnly.length > 0) {
    //console.log(`${oodiOnly.length} only in oodi, of which...`)

    // const weirds = await weirdInSIS(oodiOnly, resultOodi, programme)
    // const oodiNoWeirds = _.difference(oodiOnly, _.flatten(Object.values(weirds)))
    // const weirdosTotalLength = Object.values(weirds).reduce((acc, curr) => acc + curr.length, 0)
    // if (oodiOnly.length !== weirdosTotalLength + oodiNoWeirds.length) {
    //   console.log(
    //     `!!! oodiOnly length ${oodiOnly.length} doesn't match weirds (${weirdosTotalLength}) + no-weirds (${oodiNoWeirds.length}), check for bugs !!!`
    //   )
    // }

    // printWithReason(
    //   weirds.cancelledstudents,
    //   'marked as cancelled in sis, but oodi enddate is after sis canceldate. Also not transferred to this program.'
    // )
    // printWithReason(
    //   weirds.transferredInPakkoSiirto,
    //   'not at all in sis programme,  transferred in pakkosiirto 2020-12-17'
    // )
    // printWithReason(
    //   weirds.transferredAtSomeOtherDate,
    //   'not at all in sis programme, transferred at some date, not in pakkosiirto'
    // )
    // printWithReason(weirds.notInProgramme, 'not at all in sis programme for some reason')
    const cancelledInSis = await checkIfCancelledInSis(programme, oodiOnly)

    const cancelledInSisNums = cancelledInSis.map(s => s.studentStudentnumber)
    oodiOnly = _.difference(oodiOnly, cancelledInSisNums)
    allGrouped.oodiOnly.cancelledInSis.push(...withProgramme(cancelledInSisNums))
    allGrouped.oodiOnly.unknown.push(...withProgramme(oodiOnly))
    console.log('oodi-only')
    if (cancelledInSisNums.length > 0) {
      console.log(cancelledInSisNums.join('\n'))
    }
    if (oodiOnly.length > 0) {
      console.log(oodiOnly.join('\n'))
    }
  }

  if (sisOnly.length > 0) {
    const cancelledInOodi = await checkIfCancelledInOodi(programme, sisOnly)
    let cancelledInOodiNums = cancelledInOodi.map(s => s.student_studentnumber)

    const permanentStudyRight = cancelledInOodi.filter(s => String(s.enddate).includes('2112'))
    let permanentStudyRightNums = permanentStudyRight.map(s => s.student_studentnumber)

    cancelledInOodiNums = _.difference(cancelledInOodiNums, permanentStudyRightNums)
    sisOnly = _.difference(sisOnly, cancelledInOodiNums)

    // const wronglySetCancel = (await cancelledButGraduated(programme)).map(sn => sn.student_studentnumber)
    // const remaining = _.difference(sisOnly, wronglySetCancel)

    // if (wronglySetCancel.length > 0) {
    //   printWithReason(wronglySetCancel, 'marked with wrong cancel date in oodi')
    // }
    allGrouped.sisOnly.cancelledInOodi.push(...withProgramme(cancelledInOodiNums))
    allGrouped.sisOnly.unknown.push(...withProgramme(sisOnly))
    console.log('sis-only')
    if (cancelledInOodiNums.length > 0) {
      console.log(cancelledInOodiNums.join('\n'))
    }
    if (sisOnly.length > 0) {
      console.log(sisOnly.join('\n'))
    }
  }
}

// Function to check diff reasons

const checkIfCancelledInOodi = async (code, sisOnly) => {
  const cancelledInOodi = await Studyright.findAll({
    where: {
      canceldate: {
        [Op.ne]: null
      }
    },
    where: {
      student_studentnumber: {
        [Op.in]: sisOnly
      }
    },
    include: {
      model: StudyrightElement,
      required: true,
      where: { code }
    }
  })
  return cancelledInOodi
}

const checkIfCancelledInSis = async (code, oodiOnly) => {
  const cancelledInSis = await SISStudyright.findAll({
    where: {
      canceldate: {
        [Op.ne]: null
      }
    },
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
  })
  return cancelledInSis
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

const printWithReason = (studentnumbers, reason) => {
  if (studentnumbers.length > 0) {
    console.log(`- ${reason}: ${studentnumbers.length} students`)
    if (verbose) studentnumbers.forEach(s => console.log(s))
  }
}

const programmeDiff = async programme => {
  const years = ['2017', '2018', '2019', '2020']
  console.log('\n' + programme)
  for (const year of years) {
    await populationDiff(programme, year)
  }
}

const masterCodes = async () => {
  return (
    await StudyrightElement.findAll({
      attributes: ['code'],
      where: {
        code: {
          [Op.like]: 'MH%'
        }
      },
      group: ['code'],
      order: ['code']
    })
  ).map(s => s.code)
}

const bscCodes = async () => {
  return (
    await StudyrightElement.findAll({
      attributes: ['code'],
      where: {
        code: {
          [Op.like]: 'KH%'
        }
      },
      group: ['code'],
      order: ['code']
    })
  ).map(s => s.code)
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

  for (let i = 0; i < what.length; i++) {
    const programme = what[i]
    if (programme.startsWith('printall')) continue
    if (programme.startsWith('KH') || programme.startsWith('MH')) {
      await programmeDiff(programme)
    }
  }

  // Print with reasons
  //
  console.log('=== Only in sis ===')
  console.log('missing for...')
  printWithReason(allGrouped.sisOnly.cancelledInOodi, 'cancelled in oodi')
  printWithReason(allGrouped.sisOnly.unknown, 'unknown reason')

  console.log('')

  console.log('=== Only in oodi ===')
  console.log('missing for...')
  printWithReason(allGrouped.oodiOnly.cancelledInSis, 'cancelled in sis')
  printWithReason(allGrouped.oodiOnly.unknown, 'unknown reason')
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
