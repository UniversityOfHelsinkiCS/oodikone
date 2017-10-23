const test = require('ava')

const Course = require('../src/services/courses')

test.only('statistics of an instance are caclulated right', async t => {
  const expected = { 
    all: { 
      '014248036': 16,
      '014289817': 5,
      '014420809': 13,
      '014464603': 19,
      '014471764': 5,
      '014013627': 44,
      '014195503': 52 
    },
    pass: { 
      '014248036': 16,
      '014289817': 5,
      '014420809': 13,
      '014471764': 5,
      '014013627': 44,
      '014195503': 52 
    },
    fail: { 
      '014464603': 19 
    },
    startYear: { 
      '2011': 1, '2013': 2, '2014': 3, '2016': 1 
    } 
  }  
 
  const result = await Course.statisticsOf("581259", "2016-06-14", 13)

  t.deepEqual(result, expected)

})