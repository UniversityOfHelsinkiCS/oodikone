/* eslint-disable */ 
const _ = require('lodash')
const populationsSis = require('../servicesV2/populations')
const populationsOodi = require('../services/populations')

const populationDiff = async (programme, year) => {
  const months = Number((2020-Number(year))*12 + 7)

  const query = { 
    semesters: [ 'FALL', 'SPRING' ],
    months, studyRights: { programme }, year
  }

  const resultSis = await populationsSis.optimizedStatisticsOf(query)
  const resultOodi = await populationsOodi.optimizedStatisticsOf(query)

  const studentsSis  = resultSis.students.map(s => s.studentNumber)
  const studentsOodi  = resultOodi.students.map(s => s.studentNumber)

  const sisOnly = _.difference(studentsSis, studentsOodi)
  const oodiOnly = _.difference(studentsOodi. studentsSis)
  const both = _.intersection(studentsOodi, studentsSis)
  console.log(programme, year)
  console.log('both      ', both.length)
  console.log('oodi only ', oodiOnly.length)
  console.log('sis only  ', sisOnly.length)
}

const main = async () => {
  await populationDiff('MH50_010', '2017' )
  await populationDiff('MH50_010', '2018' )
  await populationDiff('MH50_010', '2019' )
  await populationDiff('MH50_010', '2020' )
}

main()