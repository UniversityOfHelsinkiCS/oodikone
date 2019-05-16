const { CourseYearlyStatsCounter, CATEGORY } = require('./course_yearly_stats_counter')

describe('Marking credit to history', () => {

  const studentnumber = '12345678'

  describe('Student history to empty counter', () => {

    const counter = new CourseYearlyStatsCounter()
    const history = counter.studentHistory(studentnumber)

    test('Student history should have correct values', () => {
      expect(history.attempted).toBe(false)
      expect(history.failed).toBe(false)
      expect(history.failed).toBe(false)
    })

  })

  describe('Mark passed credit to empty counter', () => {
    
    const counter = new CourseYearlyStatsCounter()
    counter.markCreditToHistory(studentnumber, true)
    const history = counter.studentHistory(studentnumber)

    test('student history has correct values', () => {
      expect(history.attempted).toBe(true)
      expect(history.passed).toBe(true)
      expect(history.failed).toBe(false)
    })

  })

  describe('Mark failed credit to empty counter', () => {

    const counter = new CourseYearlyStatsCounter()
    counter.markCreditToHistory(studentnumber, false)
    const history = counter.studentHistory(studentnumber)

    test('student history has correct values', () => {
      expect(history.attempted).toBe(true)
      expect(history.passed).toBe(false)
      expect(history.failed).toBe(true)
    })

  })

  describe('Mark failed credit after passed credit', () => {

    const counter = new CourseYearlyStatsCounter()
    counter.markCreditToHistory(studentnumber, true)
    counter.markCreditToHistory(studentnumber, false)
    const history = counter.studentHistory(studentnumber)

    test('student history passed should still be true', () => {
      expect(history.passed).toBe(true)
    })

    test('student history failed should be false', () => {
      expect(history.failed).toBe(false)
    })

  })

  describe('Mark passed credit after failed credit', () => {

    const counter = new CourseYearlyStatsCounter()
    counter.markCreditToHistory(studentnumber, false)
    counter.markCreditToHistory(studentnumber, true)
    const history = counter.studentHistory(studentnumber)

    test('student history passed should be true', () => {
      expect(history.passed).toBe(true)
    })

    test('student history failed should be false', () => {
      expect(history.failed).toBe(false)
    })
  })

})

describe('Marking credit to group', () => {

  const studentnumber = '123456789'
  const groupcode = 'GROUP'
  const groupname = 'Group name'
  const PASSGRADE = '5'
  const FAILGRADE = '0'

  const markPass = counter => counter.markCreditToGroup(studentnumber, true, PASSGRADE, groupcode, groupname)
  const markFail = counter => counter.markCreditToGroup(studentnumber, false, FAILGRADE, groupcode, groupname)

  describe('Marking passed credit to group for empty counter', () => {

    const counter = new CourseYearlyStatsCounter()
    markPass(counter)

    describe('group students tests', () => {

      const { students } = counter.groups[groupcode]
      const { category, grade, passed } = students[studentnumber]

      test('student category in group should be PASS_FIRST', () => {
        expect(category).toBe(CATEGORY.PASS_FIRST)
      })
    
      test('student grade in group should be the given grade', () => {
        expect(grade).toBe(PASSGRADE)
      })

      test('student passed should be true', () => {
        expect(passed).toBe(true)
      })
    })

    describe('group attempts tests', () => {
      const { attempts } = counter.groups[groupcode]
      const { grades, classes } = attempts
      const { passed, failed } = classes

      test('studentnumber and passed grade should be in grades', () => {
        expect(grades).toHaveProperty(PASSGRADE)
        expect(grades[PASSGRADE]).toContain(studentnumber)
      })

      test('passed should contain studentnumber', () => {
        expect(passed).toContain(studentnumber)
      })

      test('failed should not contain studentnumber', () => {
        expect(failed).not.toContain(studentnumber)
      })

    })

  })

  describe('Marking failed credit to group for empty counter', () => {

    const counter = new CourseYearlyStatsCounter()
    markFail(counter)

    describe('group students tests', () => {
    
      const { students } = counter.groups[groupcode]
      const { category, grade, passed } = students[studentnumber]

      test('student category in group be FAIL_FIRST', () => {
        expect(category).toBe(CATEGORY.FAIL_FIRST)
      })

      test('student grade should be the given grade', () => {
        expect(grade).toBe(FAILGRADE)
      })

      test('student passed should be false', () => {
        expect(passed).toBe(false)
      })

    })

    describe('group attempts tests', () => {

      const { attempts } = counter.groups[groupcode]
      const { passed, failed } = attempts.classes

      test('passed should not contain studentnumber', () => {
        expect(passed).not.toContain(studentnumber)
      })

      test('failed should contain studentnumber', () => {
        expect(failed).toContain(studentnumber)
      })

    })

    test('student history should contain correct values for student', () => {
      const history = counter.studentHistory(studentnumber)
      expect(history.attempted).toBe(true)
      expect(history.passed).toBe(false)
      expect(history.failed).toBe(true)
    })

  })

  describe('Mark failed credit then passed credit to same group', () => {
    
    const counter = new CourseYearlyStatsCounter()
    markFail(counter)
    markPass(counter)
    const { students, attempts } = counter.groups[groupcode]

    test('group students should contain correct values for student', () => {
      expect(students[studentnumber]).toEqual({
        passed: true,
        grade: PASSGRADE,
        category: CATEGORY.PASS_RETRY
      })
    })

    test('group attempts should show studentnumber in grades list for failed grade value', () => {
      expect(attempts.grades).toHaveProperty(FAILGRADE)
      expect(attempts.grades[FAILGRADE]).toContain(studentnumber)
    })

    test('group attempts should show studentnumber in grades list for passed grade value', () => {
      expect(attempts.grades).toHaveProperty(PASSGRADE)
      expect(attempts.grades[PASSGRADE]).toContain(studentnumber)
    })

    test('group attempts should show studentnumber in both passed and failed lists', () => {
      expect(attempts.classes.passed).toContain(studentnumber)
      expect(attempts.classes.failed).toContain(studentnumber)
    })

    test('student history should contain correct values for student', () => {
      const history = counter.studentHistory(studentnumber)
      expect(history.passed).toBe(true)
      expect(history.failed).toBe(false)
      expect(history.attempted).toBe(true)
    })

  })

})
