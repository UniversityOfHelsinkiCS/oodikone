const test = require('ava')

const Course = require('../../src/services/courses')

test.only('statistics of an instance are caclulated right', async t => {
  const expected = {
    all: {
      '014013627': 39,
      '014195503': 47,
      '014248036': 10,
      '014289817': 0,
      '014420809': 8,
      '014464603': 19,
      '014471764': 0,
    },
    pass: {
      '014013627': 39,
      '014195503': 47,
      '014248036': 10,
      '014289817': 0,
      '014420809': 8,
      '014471764': 0,
    },
    fail: {
      '014464603': 19
    },
    startYear: {
      '2011': 1, '2013': 2, '2014': 3, '2016': 1
    }
  }

  const result = await Course.statisticsOf('581259', '2016-06-14', 13)

  t.deepEqual(result, expected)

})