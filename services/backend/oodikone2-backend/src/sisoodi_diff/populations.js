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

  if (oodiOnly.length === 0 && sisOnly.length === 0 ) {
    //console.log(' ', year,'both', both.length)
  } else {
    console.log('  ',year)
    console.log('   both      ', both.length)
    if (oodiOnly.length > 0) {
      console.log('   oodi only ', oodiOnly.length)
      console.log(oodiOnly)
    }
    if (sisOnly.length > 0) {
      console.log('   sis only  ', sisOnly.length)
      console.log(sisOnly)
    }
  }
}

const programmeDiff = async (programme) => {
  console.log(programme)
  await populationDiff(programme, '2017' )
  await populationDiff(programme, '2018' )
  await populationDiff(programme, '2019' )
  await populationDiff(programme, '2020' )
}

const main = async () => { 

  const programmes = [
    'KH50_001',
    'MH50_001', 'MH50_002', 'MH50_003','MH50_004', 'MH50_005', 'MH50_006', 'MH50_007', 'MH50_009', 'MH50_010', 'MH50_011', 'MH50_012','MH50_013' 
  ]
  
  for (let programme of programmes) {
    await programmeDiff(programme)
  }

  process.exit()

}

main()