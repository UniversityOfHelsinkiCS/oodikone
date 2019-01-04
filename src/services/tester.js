const { bottlenecksOf, optimizedStatisticsOf } = require('./populations')

const moment = require('moment')

const run2 = async () => { // eslint-disable-line
  const o = {
    semesters: ['FALL', 'SPRING'],
    year: 2017, // 2015
    studyRights: ['KH10_001'], // ['KH50_005'], // ['320001']
    months: 16// 41
  }

  const result = await bottlenecksOf(o) // eslint-disable-line

  //console.log(JSON.stringify(result.coursestatistics[0].stats, null, 2))

  //console.log(result.coursestatistics.length)

  process.exit()
}


const run1 = async () => { // eslint-disable-line
  const o = {
    semesters: ['FALL', 'SPRING'],
    year: 2018, // 2015
    studyRights: ['KH50_001'], // ['KH50_005'], // ['320001']
    months: 41// 41
  }

  const a = await optimizedStatisticsOf(o)

  const start = moment('2018-07-31')

  a.students.forEach(s1 => {
    if (true || s1.studentNumber === '014612688') { // eslint-disable-line

      const studyright = s1.studyrights.find(s => s.studyrightElements.map(d => d.element_detail.code).includes('KH50_001'))

      console.log(studyright.startdate, start.isAfter(moment(studyright.startdate)), s1.changedStudyright)
      
      
      //console.log(JSON.stringify(studyright, null, 2))

    }
    
  })

  process.exit()
}

const run3 = async () => {
  const userStatistics = require('./userService')
  const resp = await userStatistics.ping()
  console.log(resp)   
}


run3()