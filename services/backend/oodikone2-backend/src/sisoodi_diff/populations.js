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
  KH20_001: {
    2020: {
      oodi: ['011304863'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2884
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
      oodi: ['013881465'], // studyright enddate too early in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2701
      sis: ['014659913'] // näyttää oodissakin oikealta 8.5. , tarkasta myöhemmin 
    }
  },
  KH55_001: {
    2019: {
      sis: ['015160142'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2887
    }
  },
  KH60_001: {
    2017: {
      oodi: [
        // varhaiskasvatus https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2738
        '013299358', '014720169', '014711262', '014721825', '014528934', '014659133',
        '014845154' // studyright enddate too early in sis https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2787
      ]
    },
    2018: {
      // varhaiskasvatus https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2738
      oodi: ['014726105', '014708699', '014732623', '014728983', '014323074', '014624977']
    },
    2019: {
      // varhaiskasvatus https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2738
      oodi: ['014366086', '014731909', '014734511'],
      sis: ['015136875'] // https://jira.it.helsinki.fi/browse/DOO-4494 8.5. ei ollut kunnossa, taskasta uudelleen
    },
    2020: {
      // varhaiskasvatus https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2738
      oodi: ['013466013', '014590027', '014340963','014179998', '013743299', '013758239', '014590807'],
      sis: ['014734511'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2790 also a varhaiskasvatus issue
    }
  },
  KH80_001: {
    2018: {
      sis: ['014934298'] // https://jira.it.helsinki.fi/browse/DOO-4494 8.5. ei ollut kunnossa, taskasta uudelleen
    }
  },
  MH10_001: {
    2019: {
      oodi: ['014577749'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
    },
    2020: {
      oodi: ['014724767'], // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
    }
  },
  MH20_001: {
    2020: {
      oodi: [
        '014509160', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2828
      ] 
    }
  },
  MH30_004: {
    2020: {
      oodi: ['012616631'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
    }
  },
  MH40_002: {
    2019: {
      oodi: ['014720114'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
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
      //oodi: ['014143791'] //  https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2831
    }
  },
  
  MH50_001: {
    2017: {
      oodi: ['012023965'] // test student, should be ignored
    },
    2019: {
      oodi: ['015103044'] // not cancelled in oodi even if it should have been
    }, 
    2020: {
      oodi: ['014868814'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2829
    }
  },
  MH50_003: {
    2020: {
      sis: ['014020652'] // ilmottautuminen ei ehtinyt oodi-oodikoneeseen
    }
  },
  MH50_005: {
    2018: {
      sis: ['014578353'] // graduated but wrongly marked in oodi 
    },
    2020: {
      oodi: ['014589795'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2829
    }
  },
  MH50_006: {
    2017: {
      oodi: ['014840913', '014796368']  // not cancelled in oodi even if it should have been
    }
  },
  MH50_009: {
    2018: {
      oodi: ['014973194', '014903452']  // not cancelled in oodi even if it should have been
    },
    2019: {
      oodi: ['015175124']  // not cancelled in oodi even if it should have been
    },
    2020: {
      oodi: [
        '014021774', // not cancelled in oodi even if it should have been, should have been in 2019 in oodi-oodikone
        '014726943' // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2841
      ],
      sis: ['013400710'] // virheellisesti ei näy oodi-oodikoneessa
    }
  },
  MH50_011: {
    2017: {
      oodi: ['013337304'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
    }
  },
  MH55_001: {
    2018: {
      sis: ['013161732'] // puuttuu oodi-oodikoneesta
    }, 
    2019: {
      oodi: ['014744501'], // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2844
      sis: ['013295763'] // puuttuu oodi-oodikoneesta
    }, 
    2020: {
      sis: [
        '014820878', // ei näy oodi-oodikoneessa tuntemattomasta syystä
        '014957356', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2845
        '015138336', // oodi-oodikoneessa virheellisesti provisorin ohjelmassa
      ]
    }
  },
  MH57_001
  : {
    2019: {
      oodi: ['015180070'] // not cancelled in oodi even if it should have been
    }
  },
  MH57_003: {
    2017: {
      oodi: ['014818220'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2846
    },
    2018: {
      oodi: ['014905308', '014935828'], // not cancelled in oodi even if it should have been
      sis: ['014949160'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2882
    }, 
    2019: {
      sis: ['014183324'] // for some reason not showing up is oodi-oodikone despite graduated
    }
  },
  MH57_004: {
    2017: {
      sis: ['014803662'] // graduated but wrongly marked in oodi 
    },
    2019: {
      sis: ['014441105'] // graduated but wrongly marked in oodi 
    },
  },
  MH57_005: {
    2017: {
      sis: ['014137189'] // graduated but wrongly marked in oodi 
    },
    2018: {
      sis: [
        '014937428', '014952681', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2882
        '014471971'  // graduated but wrongly marked in oodi
      ],
      oodi: ['014937428'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2847
    },
    2019: {
      sis: ['014454516'], // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2847,
      oodi: ['014342961'], // TODO ticket has ilmo but sis claims that this secondary degree has not ilmo
    },
    2020: {
      sis: ['014952681','014582844'], // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2847
      oodi: ['014467710'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2847
    },
  },
  MH70_001: {
    2017: {
      sis: ['014698592'], // graduated but wrongly marked in oodi 
    },
    2019: {
      sis: ['014393871'], // graduated but wrongly marked in oodi 
    },
    2020: {
      sis: ['011297556'], // wrongly cancelled in oodi
    }
  },
  MH70_002: {
    2018: {
      oodi: [
        '014449343', // oodi-oodikoneessa virheellisesti maisteriopiskelija vaikka kandi suorittamatta
        '014917493', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2848
        '014920697', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2848
        '014940334', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2828
      ],
      sis: ['014917639'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2882
    },
  },
  MH70_003: {
    2017: {
      oodi: ['014816374'], // should be cancelled in oodi-oodikone
      sis: ['014851290', '014830347', '014615504'] // graduated but wrongly marked in oodi 
    }
  },
  MH70_004: {
    2018: {
      oodi: [
        '014640346', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2848
        '014722264'  // oodi-oodikoneessa virheelliseti maisterissa (ei alempaa tutkintoa)
      ],
      sis: ['014919873'] //
    },
    2019: {
      sis: ['014411148'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2882
    },
    2020: {
      oodi: [
        '014054453', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
        '014919585', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2829
        '014931505', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2829
        '014946914', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2848
      ]
    }
  },
  MH70_006: {
    2018: {
      oodi: ['015000862'] // not cancelled in oodi even if it should have been
    }, 
  },
  MH70_007: {
    2017: {
      oodi: [
        '013324281', '014289642', '014463565', '013940775', '014330287' // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
      ]
    }, 
  },
  MH70_008: {
    2017: {
      oodi: ['014404139'], // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2850
      sis: ['014814156'] // graduated but wrongly marked in oodi 
    },
    2018: {
      oodi: [
        '013175676', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2852
        '012451964',  // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2853
        '014727214', '014732694', // not acually a master student, oodi-oodikone fakap
      ], 
      sis: ['014370386'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2882
    },
    2019: {
      oodi: ['013033815'], // a clear fukap in oodi-oodikone,
      sis: ['014863644'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2882
    },
    2020: {
      oodi: [
        '013032023', '014170751', '014453520', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
        '012740358' // oodi-oodikoneessa virheelliseti maisterissa (ei alempaa tutkintoa)
      ], 
      sis: ['014467710', ] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2854
    }
  },
  MH70_009: {
    2018: {
      oodi: ['014716270'] // oodi-oodikoneessa virheelliseti maisterissa (ei alempaa tutkintoa)
    },
    2020: {
      oodi: ['011309295'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2829
    }
  },
  MH80_001: {
    2019: {
      oodi: ['014816950'], // oodi-oodikoneessa virheelliseti maisterissa (ei alempaa tutkintoa)
      sis: ['014341027'] // graduated but wrongly marked in oodi 
    },
    2020: {
      oodi: [
        '014343643', '014015735', '014016572', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
        '014816934'  // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2828
        // '014015735' dunno about this
      ]
    }
  },
  MH80_002: {
    2017: {
      oodi: ['014855458'] // ilmottautuminen puuttuu, oodi-oodikoneessa prblm
    },
    2019: {
      oodi: ['015186113'] // ilmottautuminen puuttuu, oodi-oodikoneessa prblm
    }
  },
  MH80_003: {
    2018: {
      oodi: ['013451099'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827
    },
    2019: {
      oodi: ['015087461']  // ilmottautuminen puuttuu, oodi-oodikoneessa prblm
    },
    2020: {
      oodi: [
        '014923924', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2829
        '014588039' // väärin oodissa
      ] 
    },
  },
  MH80_005: {
    2020: {
      oodi: ['010956351'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2859
    }
  },
  MH80_006: {
    2020: {
      oodi: ['014586293'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2828
    }
  },
  MH80_007: {
    2018: {
      oodi: ['015009423'], // ilmottautuminen puuttuu, oodi-oodikoneessa prblm
      sis: [
        '014477179', '014018651' // ei näy tuntemattomasta syystä oodi-oodikoneessa
      ]
    },
    2019: {
      oodi: ['014713406'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827 
    },
    2020: {
      oodi: [
        '013214702', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2827 
        '014928806' // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2829
      ], 
      sis: ['014591314'] // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2860
    }
  },
  MH60_001: {
    2017: {
      oodi: ['014722206'], // oodi-oodikoneessa virheelliseti maisterissa (ei alempaa tutkintoa)
      sis: [ '014739590', '014849105', '014750427', '014848627', '014811706', '014830114', 
        '014786132', '011488048', '012740617', '014451234', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2864
        '014829031' // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2882
      ] 
    },
    2018: {
      oodi: [
        '011488048', '014750427', '014624977', '014659133', '014720169', '014721825', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2864
        '013143064', '014021813', '014470723', '014631821', '014643660', '014716102', '014716979', '014726082' // oodi-oodikoneessa virheelliseti maisterissa (ei alempaa tutkintoa)
      ]
    },
    2019: {
      oodi: [
        '012740617','014830114', '014811706', '014786132', '014451234', '014323074', '014366086', '014528934', '014708699', '014711262', '014726105','014728983', '014731909', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2864
        '014732623' // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2866
      ]
    },
    2020: {
      sis: [
        '014829031', '014818848', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2861
        '014734511' // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2862
      ],
      oodi: ['014954744', '014711864', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2865
        '011856463', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2786
        '014739590', '014848627', '014849105', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2864
        '014819504', // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2829
        '014222324', // oodi-oodikoneessa virheelliseti maisterissa (ei alempaa tutkintoa),
        '014723645' // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2828
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

  console.log('\n'+year)

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
  console.log(programmes.join('\n'))
  for (let programme of programmes) {
    //await programmeDiff(programme)
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
