const { optimizedStatisticsOf, optimizedStatisticsOf2} = require('./populations')

const diff = require('deep-diff').diff
var equal = require('deep-equal')

const _ = require('lodash')

const run = async () => {
  const o = {
    semesters: ['FALL', 'SPRING'],
    year: 2017, // 2015
    studyRights: ['MH30_001'], // ['KH50_005'], // ['320001']
    months: 41// 41
  }

  const a = await optimizedStatisticsOf(o)

  const b = await optimizedStatisticsOf2(o)

  a.students.forEach(s1 => {
    //console.log(s1.studentNumber, s1.courses.length)
    const s2 = b.students.find(ss => ss.studentNumber === s1.studentNumber)
    //console.log(JSON.stringify(s2, null, 2))
    //console.log(s1.courses.length, s2.courses.length)
    if (!equal(s1.courses, s2.courses)) {
      console.log('*')
      console.log(s1.studentNumber)
      //console.log(s1.studentNumber, s1.courses.length, s2.courses.length)

      //console.log(_.difference(s1.courses, s2.courses).length)
      //console.log(JSON.stringify(s1.courses[0], null, 2))

      s1.courses.forEach(c => {
        const same = (cc) =>  {
          //if (c.course.code === '339101' && cc.course.code === '339101' ) console.log('*',c.date, cc.date)

          return cc.course.code === c.course.code && (new Date(cc.date)).getTime() == (new Date(c.date)).getTime()
        }

        const sama = s2.courses.find(same)
        if (!sama) {
          //console.log(JSON.stringify(c, null, 2))
        }
      })

      //process.exit(1)
    }

  })

  process.exit()
}

run()