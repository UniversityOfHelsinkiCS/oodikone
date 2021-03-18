/* eslint-disable */

const _ = require('lodash')
const populationsSis = require('../servicesV2/populations')
const populationsOodi = require('../services/populations')
const { Studyright, StudyrightElement } = require('../models')
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
  'KH57_002': {
    '2017': {
      'oodi': ['014818220'] // graduation missing in sis-oodikone https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2705
    }
  },
  'KH74_001': {
    '2019': {
      'sis': ['014480768'] // graduation missing in oodi https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2705
    }
  },
  'KH90_001': {
    '2020': {
      'sis': ['014261181'] // many things wrong... https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2707
    }
  },
  'KH55_001': {
    '2019': {
      'sis': ['015160142'] // duplicate studyrigth https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2709
    }
  },
  'KH57_001': {
    '2018': {
      'sis': ['013296128']
    }
  }
}



const populationDiff = async (programme, year) => {
  const months = Number((2020 - Number(year)) * 12 + 7)
  if (verbose) {
    //console.log('amount of months to fetch', months)
  }

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

  if (oodiOnly.length === 0 && sisOnly.length === 0) {
  } else {
    if (oodiOnly.length > 0) {
      console.log('  ', year, '   oodi only', oodiOnly.length, 'both', both.length)
      if (verbose) {
        oodiOnly.forEach(s => {
          console.log('  ', s)
        })
      }
    }
    if (sisOnly.length > 0) {
      const wronglyMarked = (await cancelledButGraduated(programme)).map(s => s.student_studentnumber)
      const remaining = _.difference(wronglyMarked, sisOnly)
      if (verbose) {
        console.log('wrongly marked', wronglyMarked)
        console.log('remaining', remaining)
      }
      if (wronglyMarked.length > 1 && remaining.length == 0) {
        if (verbose) {
          console.log('  ', year, '   sis only', sisOnly.length, 'wrongly set cancel date in oodi', 'both', both.length)
        }
      } else {
        console.log('******************************************')
        console.log('  ', year, '   sis only', sisOnly.length, 'both', both.length)
      }
      if (verbose) {
        sisOnly.forEach(s => {
          console.log('  ', s)
        })
      }
    }
  }
}

const programmeDiff = async programme => {
  console.log(programme)
  await populationDiff(programme, '2017')
  await populationDiff(programme, '2018')
  await populationDiff(programme, '2019')
  await populationDiff(programme, '2020')
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
