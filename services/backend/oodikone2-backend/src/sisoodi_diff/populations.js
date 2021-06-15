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
  KH50_001: {
    2020: {
      oodi: ['013470384'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
    }
  },

  KH60_001: {
    2017: {
      oodi: [
        '014845154', // https://jira.it.helsinki.fi/browse/DOO-4547 (differing end date)
        '013299358' // https://jira.it.helsinki.fi/browse/DOO-4545 // koulutus puuttuu
      ]
    },
    2018: {
      oodi: [
        '014323074' // https://jira.it.helsinki.fi/browse/DOO-4545 // koulutus puuttuu
      ]
    },
    2019: {
      oodi: [
        '014366086' // https://jira.it.helsinki.fi/browse/DOO-4545 // koulutus puuttuu
      ]
    },
    2020: {
      oodi: [
        '013466013', // https://jira.it.helsinki.fi/browse/DOO-4545 // koulutus puuttuu
        '014590027',
        '014340963',
        '014179998',
        '013743299'
      ]
    }
  },

  MH10_001: {
    2020: {
      oodi: ['014925414'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2900
    }
  },
  MH20_001: {
    2020: {
      oodi: ['014509160'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2972
    }
  },

  MH40_005: {
    2019: {
      oodi: ['015095686'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
    }
  },

  MH40_014: {
    2020: {
      oodi: ['013349512'] //  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2831
    }
  },
  MH40_015: {
    2020: {
      oodi: ['014143791'] //  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2831
    }
  },
  MH55_001: {
    2019: {
      oodi: ['014744501'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2844
    }
  },

  MH70_008: {
    2017: {
      oodi: ['014404139'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2850
    }
  },
  MH80_001: {
    2020: {
      oodi: [
        '014343643',
        '014016572' // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
      ]
    }
  },

  MH60_001: {
    2017: {
      sis: [
        '014741193' // https://jira.it.helsinki.fi/browse/DOO-4546
      ]
    },
    2019: {
      oodi: [
        '014323074', // https://jira.it.helsinki.fi/browse/DOO-4545
        '014366086'
      ]
    },
    2020: {
      sis: [
        '014734511' // https://jira.it.helsinki.fi/browse/DOO-4546
      ],
      oodi: [
        '014741193', // https://jira.it.helsinki.fi/browse/DOO-4546
        '014954744' // https://jira.it.helsinki.fi/browse/DOO-4548
      ]
    }
  },
  // there are many inconsistencies in masters, so they're grouped by the reason, not
  // by program for now
  MH_ALL: {
    // in sis, but not in oodi
    sis: [
      '014581611', // not in oodi-oodikone due to fukap pre 8.5.2021
      '014650093', // KH40_005 on tosiaan vähän ristiriitaiset tiedot Oodissa. Sisussa näkyy kuitenkin ok, niin että annetaan olla
      '013617228', // KH55_001 sisussa opinto-oikeus jatkuu hieman kauemmin 1.8.2021 vs 21.3.2021 eli close enouhgh
      '013296128', // KH57_001 puuttuu oodi-oodikoneesta
      '014480768', // KH74_001 graduation missing in oodi
      '014588039', // KH80_002 näyttää olevan oikein, ei tietoa miksi ei näy sisussa 8.5.
      '012334670', // MH10_001 oodissa virheellisesti peruttuna (jäänyt ilmoittautumatta vaikka on acually)
      '014444047', // MH40_003 graduated but wrongly marked in oodi
      '014939002', // MH40_005 graduated but wrongly marked in oodi
      '014193880', // MH40_006 graduated but wrongly marked in oodi
      '010951408', // MH40_009 oodissa virheellisesti peruttuna (jäänyt ilmoittautumatta vaikka on acually)
      '014145812', // MH40_010 graduated but wrongly marked in oodi
      '014445428', // MH40_014 graduated but wrongly marked in oodi
      '014578353', // MH50_005 graduated but wrongly marked in oodi
      '013400710', // MH50_009 virheellisesti ei näy oodi-oodikoneessa
      '013161732', // MH55_001 puuttuu oodi-oodikoneesta
      '013295763', // MH55_001 puuttuu oodi-oodikoneesta
      '014183324', // MH57_003 tuntemattomasta syystä puuttuu oodi-oodikoneen populaatiosta
      '014803662', // MH57_004 graduated but wrongly marked in oodi
      '014441105', // MH57_004 graduated but wrongly marked in oodi
      '014137189', // MH57_005 graduated but wrongly marked in oodi
      '014471971', // MH57_005 graduated but wrongly marked in oodi
      '014698592', // MH70_001 graduated but wrongly marked in oodi
      '014393871', // MH70_001 graduated but wrongly marked in oodi
      '011297556', // MH70_001 wrongly canceled in oodi-oodikone, dunno why
      '011199159', // MH70_002 wrongly canceled in oodi-oodikone, dunno why
      '014615504', // MH70_003 graduated but wrongly marked in oodi
      '014830347', // MH70_003 graduated but wrongly marked in oodi
      '014851290', // MH70_003 graduated but wrongly marked in oodi
      '014814156', // MH70_008 graduated but wrongly marked in oodi
      '014341027', // MH80_001 graduated but wrongly marked in oodi
      '014477179', // MH80_007 graduated but wrongly marked in oodi
      '013043575', // KH40_004 poissaolevana, mutta oodikoneessa virheellisesti cancelled
      '014957356', // KH55_001 for unknown reasons does not show in oodi-oodikone
      '015160142', // KH55_001 according to eija is oikein in oodi
      '012629851', // MH40_002 virheellisesti ei näy oodi-oodikoneessa
      '013631550', // MH50_012 virheellisesti ei näy oodi-oodikoneessa
      '013023498', // KH57_002 has longer studyright length in sisu
      '014940525', // MH20_001 graduated but wrongly marked in oodi-oodikone
      // after master change
      '015077963', // KH10_001 ilmottautunut 19.5.
      '010862241', // KH30_001 oodissa ei siirretty uuteen koulutusohjelmaan
      '013751935', // KH40_003 oodissa ei siirretty uuteen koulutusohjelmaan
      '012846184', // KH50_001 ilmottautunut 24.5.
      '013041959', // KH50_001 ilmo 20.4. (eri opinto-oikeuteen ilman HYY jäsenyyttä)
      '015123859', // KH50_005 ilmottautunut 2.6.
      '014598249', // KH50_005 ilmottautunut 25.5.
      '012908381', // KH57_001 ilmo 11.3. (eri opinto-oikeuteen ilman HYY jäsenyyttä)
      '013869393', // KH70_001 ilmottautunut 31.5.
      '014641471', // KH60_001 ilmottautunut 2.6.
      '014819533', // MH60_001 valmistunut 31.5.
      '014921285', // MH60_001 valmistunut 31.5.
      '013471451', // MH40_002 puuttui oodi-oodikoneesta tuntemattomasta syystä
      '010760864', // MH40_002 ilmottautunut 7.6.
      '014808573', // MH60_001 valmistunut 31.5.
      '014921230', // MH40_003 valmistunut 1.6.
      '014645309', // MH40_003 valmistunut 1.6.
      '014949416', // MH40_010 valmistunut 31.5.
      '014838093', // MH50_001 valmistunut 14.5.
      '014900235', // MH40_001 valmistunut 30.5.
      '014950861', // MH40_001 valmistunut 1.6.
      '012685824', // MH50_009 ilmottautunut 26.5.
      '015128870', // MH57_003 valmistunut 14.5.
      '014728640', // MH57_004 valmistunut 14.5.
      '015109022', // MH70_002 valmistunut 14.5.
      '014921764', // MH70_002 valmistunut 14.5.
      '014928518', // MH70_004 valmistunut 14.5.
      '014922899', // MH70_004 valmistunut 14.5.
      '014919967', //  MH70_009 valmistunut 14.5.
      '014725737' //  MH70_009 valmistunut 14.5.
    ],
    // in oodi, but not in sis
    oodi: [
      '014816167', // on tohtoriopiskelija, mutta kandioikeus jätetty oodissa voimaan KH10_001
      '013878737', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2781
      // 9.5 ->
      '014938427', // MH20_001 väärin oodi-oodikoneessa, ei ole maisteriopiskelija
      '014846467', // MH20_002 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '011513023', // MH30_004 ei vielä maisteriopiskelija
      '015100050', // MH40_003 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014913549', // MH40_005 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '011516143', // MH40_008 ei vielä maisteriopiskelija
      '012023965', // MH50_001 testiopiskelija
      '015103044', // MH50_001 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014796368', // MH50_006 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014840913', // MH50_006 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014973194', // MH50_009 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014903452', // MH50_009 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '015175124', // MH50_009 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '015180070', // MH57_001 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014905308', // MH57_003 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014935828', // MH57_003 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014449343', // MH70_002 ei vielä maisteriopiskelija
      '014816374', // MH70_003 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014946914', // MH70_004 oodissa maisteriohjelma väärin kahteen kertaan
      '014722264', // MH70_004 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '015000862', // MH70_006 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014716270', // MH70_009 ei vielä maisteriopiskelija
      '014727214', // MH70_008 ei vielä maisteriopiskelija
      '014732694', // MH70_008 ei vielä maisteriopiskelija
      '012740358', // MH70_008 ei vielä maisteriopiskelija
      '013033815', // MH70_008 ei maisterioikeutta
      '014816950', // MH80_001 ei vielä maisteriopiskelija
      '014855458', // MH80_002 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '015186113', // MH80_002 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '015087461', // MH80_003 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014588039', // MH80_003 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '015009423', // MH80_007 väärin oodi-oodikoneessa, ei ole ilmottautunut ollenkaan
      '014722206', // MH60_001 ei vielä maisteriopiskelija
      '013143064', // MH60_001 ei vielä maisteriopiskelija
      '014021813', // MH60_001 ei vielä maisteriopiskelija
      '014470723', // MH60_001 ei vielä maisteriopiskelija
      '014631821', // MH60_001 ei vielä maisteriopiskelija
      '014643660', // MH60_001 ei vielä maisteriopiskelija
      '014716102', // MH60_001 ei vielä maisteriopiskelija
      '014716979', // MH60_001 ei vielä maisteriopiskelija
      '014726082', // MH60_001 ei vielä maisteriopiskelija
      '014222324', // MH60_001 ei vielä maisteriopiskelija
      '014589766', // MH20_001 ei vielä maisteriopiskelija
      // after master change
      '014596115', // KH40_005 luopunut 15.5.
      '015111191', // KH50_008 luopunut 2.6.
      '015326258', // KH80_002 luopunut 17.5.
      '014457568', // MH10_001 luopunut 17.5.
      '014575411' // MH40_007 luopunut 24.5.
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

  //console.log(year, studentsSis.length, studentsOodi.length)

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

  console.log('\n' + year)

  if (oodiOnly.length > 0) {
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
  console.log(programmes.join('\n'))
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

  // importing this module in transfers runs module without args, so we need to return here
  if (process.argv.length === 2) return

  const what = process.argv.slice(2)

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

  REMAINING ISSUES

  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2787
  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2828

  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2831
  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2844
  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2850
  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2900

  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2972
  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2984
*/

module.exports = {
  ignores
}
