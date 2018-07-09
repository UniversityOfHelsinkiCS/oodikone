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

describe('Student with BSc & Mathematics studyrights (2011-07-31 – 2016-12-20), with a passed course credit in Fall 2011. ', () => {

  const course = {
    code: 'COURSE-1',
    name: langify('COURSE-1')
  }

  const courseinstance = {
    course_code: course.code,
    coursedate: new Date('2011-07-31 21:00:00+00')
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

  const credit = {
    id: 'CREDIT-1',
    student_studentnumber: student.studentnumber,
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
    const dbcourseinstance = await CourseInstance.create(courseinstance)
    await Credit.create({...credit, courseinstance_id: dbcourseinstance.id})
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

  test('Query result for BSc and Computer Science, Fall 2011 for 12 months should not contain the student. ', async () => {
    const query = createQueryObject('2011', SEMESTER.FALL, [bachelorOfScience.code, computerScience.code], 12)
    const queryResult = await optimizedStatisticsOf(query)
    expect(queryResult.some(s => s.studentNumber === student.student_studentnumber)).toBe(false)
  })

  test('Query result for BSc and Mathematics, Fall 2011 for 12 months should contain the student.', async () => {
    const query = createQueryObject('2011', SEMESTER.FALL, [bachelorOfScience.code, mathematics.code], 12)
    const queryResult = await optimizedStatisticsOf(query)
    expect(queryResult.some(s => s.studentNumber === student.studentnumber)).toBe(true)
  })

})
