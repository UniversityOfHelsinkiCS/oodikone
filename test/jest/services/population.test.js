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

describe('Student with BSc studyright, 2011-07-31, passed course credit in Fall 2011. ', () => {

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

  const elementdetail = {
    code: 'ED01',
    type: 10,
    name: langify('Bachelor of Science')
  }

  const studyright = {
    studyrightid: 1,
    student_studentnumber: student.studentnumber
  }

  const credit = {
    id: 'CREDIT-1',
    student_studentnumber: student.studentnumber,
  }

  const studyrightelement = {
    startdate: new Date('2011-07-31 21:00:00+00'),
    enddate: Date('2016-12-20 22:00:00+00'),
    studyrightid: studyright.studyrightid,
    code: elementdetail.code,
    studentnumber: student.studentnumber
  }

  beforeAll(async () => {
    await forceSyncDatabase()
    await Student.create(student)
    await Course.create(course)
    const dbcourseinstance = await CourseInstance.create(courseinstance)
    await Credit.create({...credit, courseinstance_id: dbcourseinstance.id})
    await ElementDetails.create(elementdetail)
    await Studyright.create(studyright)
    await StudyrightElement.create(studyrightelement)
  })

  test('Query result for BSc, Fall 2017 for 12 months, should contain the student.', async () => {
    const query = createQueryObject('2011', SEMESTER.FALL, [studyrightelement.code], 12)
    const queryResult = await optimizedStatisticsOf(query)
    expect(queryResult.some(s => s.studentNumber === student.studentnumber)).toBe(true)
  })

  test('Query result for BSc, Fall 2018 for 12 months should not contain the student.', async () => {
    const query = createQueryObject('2012', SEMESTER.FALL, [studyrightelement.code], 12)
    const queryResult = await optimizedStatisticsOf(query)
    expect(queryResult.some(s => s.studentNumber === student.studentnumber)).toBe(false)
  })

})
