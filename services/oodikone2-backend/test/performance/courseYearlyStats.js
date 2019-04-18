const Course = require('../../src/services/courses')
const { createstamper } = require('./stamper')


const query1 = [
  'TKT10005',
  {
    start: '2017',
    end: '2018'
  },
  false,
  'fi'
]

const query2 = [
  'TKT10004',
  {
    start: '2015',
    end: '2018'
  },
  true,
  'fi'
]

const run = async () => {
  const stamper = createstamper()
  stamper.start()
  await Course.yearlyStatsOf(...query1)
  stamper.stamp('after query 1')
  
  stamper.start()
  await Course.yearlyStatsOf(...query2)
  stamper.stamp('after query 2')
  process.exit()
}

run()
