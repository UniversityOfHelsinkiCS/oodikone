const { forceSyncDatabase } = require('../../../src/database/connection')
const { sequelize, Student, Course, CourseInstance, ElementDetails, StudyrightElement, Studyright, Credit } = require('../../../src/models/index')
const { optimizedStatisticsOf } = require('../../../src/services/populations')

const langify = name => ({
  en: `${name}_en`,
  fi: `${name}_fi`,
  sv: `${name}_sv`
})

const SEMESTER = { SPRING: 'SPRING', FALL: 'FALL' }

const createQueryObject = (year, semester, codes, months) => ({
  studyRights: codes,
  year,
  semester,
  months
})

afterAll(async () => {
  await sequelize.close()
})

describe(`
Student with:
- BSc studyright (2011-07-31 – 2016-12-20),
- Mathematics studyright (2011-07-31 – 2016-12-20),
- Two credits in 2011-09-31 and 2012-02-31.
`, () => {

  const course = {
    code: 'COURSE-1',
    name: langify('COURSE-1')
  }

  const courseinstanceFall = {
    id: 1,
    course_code: course.code,
    coursedate: new Date('2011-09-31 21:00:00+00')
  }

  const courseinstanceSpring = {
    id: 2,
    course_code: course.code,
    coursedate: new Date('2012-02-31 21:00:00+00')
  }

  const student = {
    studentnumber: '1234',
  }

  const bachelorOfScience = {
    code: 'Element_BSC',
    type: 10,
    name: langify('Bachelor of Science')
  }

  const mathematics = {
    code: 'Element_MATH',
    type: 20,
    name: langify('Mathematics')
  }

  const computerScience = {
    code: 'ELEMENT_CS',
    type: 20,
    name: langify('Computer Science')
  }

  const studyright = {
    studyrightid: 1,
    student_studentnumber: student.studentnumber
  }

  const creditFall = {
    id: 'CREDIT-1',
    student_studentnumber: student.studentnumber,
    courseinstance_id: courseinstanceFall.id
  }

  const creditSpring = {
    id: 'CREDIT-2',
    student_studentnumber: student.studentnumber,
    courseinstance_id: courseinstanceSpring.id
  }

  const studyrightBSc = {
    startdate: new Date('2011-07-31 21:00:00+00'),
    enddate: Date('2016-12-20 22:00:00+00'),
    studyrightid: studyright.studyrightid,
    code: bachelorOfScience.code,
    studentnumber: student.studentnumber
  }

  const studyrightMaths = {
    startdate: new Date('2011-07-31 21:00:00+00'),
    enddate: Date('2016-12-20 22:00:00+00'),
    studyrightid: studyright.studyrightid,
    code: mathematics.code,
    studentnumber: student.studentnumber
  }

  beforeAll(async () => {
    await forceSyncDatabase()
    await Student.create(student)
    await Course.create(course)
    await CourseInstance.create(courseinstanceFall)
    await CourseInstance.create(courseinstanceSpring)
    await Credit.create(creditFall)
    await Credit.create(creditSpring)
    await ElementDetails.create(bachelorOfScience)
    await ElementDetails.create(mathematics)
    await ElementDetails.create(computerScience)
    await Studyright.create(studyright)
    await StudyrightElement.create(studyrightBSc)
    await StudyrightElement.create(studyrightMaths)
  })

  test('Query result for BSc, Fall 2011 for 12 months should contain the student.', async () => {
    const query = createQueryObject('2011', SEMESTER.FALL, [bachelorOfScience.code], 12)
    const queryResult = await optimizedStatisticsOf(query)
    expect(queryResult.some(s => s.studentNumber === student.studentnumber)).toBe(true)
  })

  test('Query result for BSc, Fall 2012 for 12 months should not contain the student.', async () => {
    const query = createQueryObject('2012', SEMESTER.FALL, [bachelorOfScience.code], 12)
    const queryResult = await optimizedStatisticsOf(query)
    expect(queryResult.some(s => s.studentNumber === student.studentnumber)).toBe(false)
  })

  test('Query result for BSc and Computer Science, Fall 2011 for 12 months should not contain the student.', async () => {
    const query = createQueryObject('2011', SEMESTER.FALL, [bachelorOfScience.code, computerScience.code], 12)
    const queryResult = await optimizedStatisticsOf(query)
    expect(queryResult.some(s => s.studentNumber === student.student_studentnumber)).toBe(false)
  })

  test('Query result for BSc and Mathematics, Fall 2011 for 12 months should contain the student.', async () => {
    const query = createQueryObject('2011', SEMESTER.FALL, [bachelorOfScience.code, mathematics.code], 12)
    const queryResult = await optimizedStatisticsOf(query)
    expect(queryResult.some(s => s.studentNumber === student.studentnumber)).toBe(true)
  })

  test('Query result for BSc, Spring 2012 for 12 months should not contain the student', async () => {
    const query = createQueryObject('2012', SEMESTER.SPRING, [bachelorOfScience.code], 12)
    const queryResult = await optimizedStatisticsOf(query)
    expect(queryResult.some(s => s.studentNumber === student.studentnumber)).toBe(false)
  })

  test('Query result for BSc, Fall 2011 for 4 months should only return the FALL course instance for student. ', async () => {
    const query = createQueryObject('2011', SEMESTER.FALL, [bachelorOfScience.code], 4)
    const queryResult = await optimizedStatisticsOf(query)
    const result = queryResult.find(s => s.studentNumber === student.studentnumber)
    const courseinstances = result.courses
    expect(courseinstances.length).toBe(1)
    expect(
      courseinstances.some(instance =>
        (instance.date === courseinstanceFall.date) &&
        (instance.course.code === course.code))
    ).not.toBe(undefined)
  })

  test('Query result for BSc, Fall 2011 for 1 month should not return student since they do not have any credits yet. ', async () => {
    const query = createQueryObject('2011', SEMESTER.FALL, [bachelorOfScience.code], 1)
    const result = await optimizedStatisticsOf(query)
    expect(result.some(s => s.studentNumber === student.studentnumber)).toBe(false)
  })

})
