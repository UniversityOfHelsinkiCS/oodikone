const { CourseStatsCounter } = require('./course_stats_counter')

describe('CourseStatsCounter tests', () => {
  
  const studentnumbers = ['1', '2', '3', '4', '5']
  const allstudents = studentnumbers.reduce((numbers, num) => ({ ...numbers, [num]: true }), {})
  const coursecode = 'COURSE_01'
  const coursename = 'COURSE NAME'

  const createCounter = () => new CourseStatsCounter(coursecode, coursename, allstudents)

  describe('counter constructor should set course values correctly', () => {

    const counter = createCounter()

    test('course name should be set after creation', () => {
      expect(counter.course.name).toBe(coursename)
    })
    
    test('course code should be set after creation', () => {
      expect(counter.course.code).toBe(coursecode)
    })
    
  })

  describe('mark passed credit for student', () => {

    const student = studentnumbers[0]
    const grade = '5'
    const counter = createCounter()

    counter.markCredit(student, grade, true, false, false)
    const { all, failed, passed, notParticipated, notParticipatedOrFailed } = counter.students


    test('all should have studentnumber as key', () => {
      expect(all).toHaveProperty(student)
    })

    test('passed students should have studentnumber as key', () => {
      expect(passed).toHaveProperty(student)
    })

    test('failed students should not have studentnumber as key', () => {
      expect(failed).not.toHaveProperty(student)
    })

    test('notParticipated should not have studentnumber as key', () => {
      expect(notParticipated).not.toHaveProperty(student)
    })

    test('notParticipatedOrFailed should not have studentnumber as key', () => {
      expect(notParticipatedOrFailed).not.toHaveProperty(student)
    })

  })

  describe('mark failed credit for student', () => {

    const student = studentnumbers[0]
    const grade = '0'
    const counter = createCounter()

    counter.markCredit(student, grade, false, true, false)

    const { all, failed, passed, notParticipated, notParticipatedOrFailed } = counter.students

    test('all should have studentnumber as key', () => {
      expect(all).toHaveProperty(student)
    })

    test('failed students should have studentnumber as key', () => {
      expect(failed).toHaveProperty(student)
    })

    test('passed students should not have studentnumber as key', () => {
      expect(passed).not.toHaveProperty(student)
    })

    test('notParticipated should not have studentnumber as key', () => {
      expect(notParticipated).not.toHaveProperty(student)
    })

    test('notParticipatedOrFailed should have studentnumber as key', () => {
      expect(notParticipatedOrFailed).toHaveProperty(student)
    })

  })

  describe('mark failed credit then passed credit for student', () => {
    
    const student = studentnumbers[0]
    const counter = createCounter()

    counter.markCredit(student, '0', false, true, false)
    counter.markCredit(student, '5', true, false, false)

    const { passed, failed, retryPassed, notParticipatedOrFailed } = counter.students

    test('failed students should not have studentnumber as key', () => {
      expect(failed).not.toHaveProperty(student)
    })

    test('passed students should have studentnumber as key', () => {
      expect(passed).toHaveProperty(student)
    })

    test('retryPassed should have studentnumber as key', () => {
      expect(retryPassed).toHaveProperty(student)
    })

    test('notParticipatedOrFailed should not have studentnumber as key', () => {
      expect(notParticipatedOrFailed).not.toHaveProperty(student)
    })

  })

  describe('mark passed credit then failed credit for student', () => {
    
    const student = studentnumbers[0]
    const counter = createCounter()

    counter.markCredit(student, '5', true, false, false)
    counter.markCredit(student, '0', false, true, false)

    const { passed, failed, retryPassed, notParticipatedOrFailed } = counter.students

    test('failed students should not have studentnumber as key', () => {
      expect(failed).not.toHaveProperty(student)
    })

    test('passed students should have studentnumber', () => {
      expect(passed).toHaveProperty(student)
    })

    test('retryPassed should have student', () => {
      expect(retryPassed).toHaveProperty(student)
    })

    test('notParticipatedOrFailed should not have student', () => {
      expect(notParticipatedOrFailed).not.toHaveProperty(student)
    })

  })

  describe('mark failed credit then failed credit for student', () => {

    const student = studentnumbers[0]
    const counter = createCounter()

    counter.markCredit(student, '0', false, true, false)
    counter.markCredit(student, '0', false, true, false)

    const { failed, passed, failedMany } = counter.students

    test('failed students should have studentnumber', () => {
      expect(failed).toHaveProperty(student)
    })

    test('passed students should not have studentnumber', () => {
      expect(passed).not.toHaveProperty(student)
    })

    test('failed many students should have students', () => {
      expect(failedMany).toHaveProperty(student)
    })

  })

  describe('mark passed then failed then failed for student', () => {

    const student = studentnumbers[0]
    const counter = createCounter()

    counter.markCredit(student, '5', true, false, false)
    counter.markCredit(student, '0', false, true, false)
    counter.markCredit(student, '0', false, true, false)
    
    const { passed, failed, failedMany, notParticipatedOrFailed, retryPassed } = counter.students

    test('passed students should have studentnumber', () => {
      expect(passed).toHaveProperty(student)
    })

    test('failed students should not have studentnumber', () => {
      expect(failed).not.toHaveProperty(student)
    })

    test('failedMany should not have studentnumber', () => {
      expect(failedMany).not.toHaveProperty(student)
    })

    test('notParticipatedOrFailed should not have studentnumber', () => {
      expect(notParticipatedOrFailed).not.toHaveProperty(student)
    })

    test('retryPassed should have studentnumber', () => {
      expect(retryPassed).toHaveProperty(student)
    })

  })

  describe('mark passed then improved grade for student', () => {

    const student = studentnumbers[0]
    const counter = createCounter()

    counter.markCredit(student, '3', true, false, false)
    counter.markCredit(student, '5', false, false, true)

    const { passed, improvedPassedGrade } = counter.students

    test('passed should contain student', () => {
      expect(passed).toHaveProperty(student)
    })

    test('improvedPassedGrade should have student', () => {
      expect(improvedPassedGrade).toHaveProperty(student)
    })

  })

  describe('mark improved grade then failed for student', () => {

    const student = studentnumbers[0]
    const counter = createCounter()

    counter.markCredit(student, '3', false, false, true)
    counter.markCredit(student, '0', false, true, false)

    const { passed, improvedPassedGrade, failed } = counter.students

    test('passed should contain student', () => {
      expect(passed).toHaveProperty(student)
    })

    test('improvedPassedGrade should contain student', () => {
      expect(improvedPassedGrade).toHaveProperty(student)
    })
    
    test('failed should not contain student', () => {
      expect(failed).not.toHaveProperty(student)
    })

  })

})
