/* eslint-disable */

const _ = require('lodash')
const populationsSis = require('../servicesV2/populations')
const populationsOodi = require('../services/populations')
const { Studyright, StudyrightElement } = require('../models')
const { Op } = require('sequelize')

let verbose = false

const populationDiff = async (programme, year) => {
  const months = Number((2020 - Number(year)) * 12 + 7)
  if (verbose) {
    console.log('amount of months to fetch', months)
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

  const sisOnly = _.difference(studentsSis, studentsOodi)
  const oodiOnly = _.difference(studentsOodi, studentsSis)
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
*/
