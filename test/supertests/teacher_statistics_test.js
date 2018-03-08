const test = require('ava')

const Teacher = require('../../src/services/teachers')

test('teacher statistics are calculated right', async t => {
  const expected = [
    {
      teacherId: 'Lemström Kjell Michael Bernhard',
      credits: 6,
      studentsPassed: 1,
      studentsTeached: 1,
      instancesTeached: 1
    },
    {
      teacherId: 'Luukkainen Matti Juhani',
      credits: 593,
      studentsPassed: 108,
      studentsTeached: 118,
      instancesTeached: 3
    }
  ]

  const sr = ['Bachelor of Science, Computer Science']
  const result = await Teacher.statisticsOf(['581259'], '2016-05-01', '2016-10-1', 1, 1, sr)

  t.deepEqual(result, expected)
})