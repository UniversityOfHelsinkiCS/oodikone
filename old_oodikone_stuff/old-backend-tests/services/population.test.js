const {
  Student,
  Course,
  ElementDetails,
  StudyrightElement,
  Studyright,
  Credit,
  StudyrightExtent,
  Semester,
  SemesterEnrollment
} = require('../../../src/models/index')
const { optimizedStatisticsOf } = require('../../../src/services/populations')
jest.mock('../../../src/services/semesters')
const semesterService = require('../../../src/services/semesters')
jest.setTimeout(10000)

const langify = name => ({
  en: `${name}_en`,
  fi: `${name}_fi`,
  sv: `${name}_sv`
})

const SEMESTER = { SPRING: 'SPRING', FALL: 'FALL' }

const elementdetails = {
  bsc: {
    code: 'Element_BSC',
    type: 10,
    name: langify('Bachelor of Science')
  },
  maths: {
    code: 'Element_MATH',
    type: 20,
    name: langify('Mathematics')
  },
  cs: {
    code: 'ELEMENT_CS',
    type: 20,
    name: langify('Computer Science')
  }
}

const courses = {
  elements_of_ai: {
    code: 'COURSE-1',
    name: langify('ELEMENTS_OF_AI')
  }
}

const semesters = {
  fall: {
    semestercode: 123,
    name: { en: 'Autumn 2011', fi: 'Syksy 2011', sv: 'Hösten 2011' },
    startdate: new Date('2011-07-31'),
    enddate: new Date('2012-07-30'),
    yearcode: 62,
    yearname: '2011-12'
  },
  spring: {
    semestercode: 124,
    name: { en: 'Spring 2012', fi: 'Kevät 2012', sv: 'Våren 2012' },
    startdate: new Date('2011-12-31'),
    enddate: new Date('2012-07-30'),
    yearcode: 62,
    yearname: '2011-12'
  },
  // used for mocking current
  current: {
    semestercode: 125,
    name: { en: 'Autumn 2012', fi: 'Syksy 2012', sv: 'Hösten 2012' },
    startdate: new Date('2012-08-01'),
    enddate: new Date('2012-12-31'),
    yearcode: 63,
    yearname: '2012-13'
  }
}

const createQueryObject = (year, semester, codes, months) => ({
  studyRights: codes,
  year,
  semesters: [semester],
  months
})

afterAll(async () => {})

describe('optimizedStatisticsOf tests', () => {
  const courseinstanceFall = {
    id: 1,
    course_code: courses.elements_of_ai.code,
    coursedate: new Date('2011-09-31 21:00:00+00')
  }

  const courseinstanceSpring = {
    id: 2,
    course_code: courses.elements_of_ai.code,
    coursedate: new Date('2012-02-31 21:00:00+00')
  }

  const student = {
    studentnumber: '1234'
  }

  const studyrightextents = {
    bachelors: {
      extentcode: 1,
      name: langify("bachelor's degree extent")
    }
  }

  const studyright = {
    studyrightid: 1,
    studystartdate: new Date('2011-07-31 21:00:00+00'),
    student_studentnumber: student.studentnumber,
    extentcode: studyrightextents.bachelors.extentcode
  }

  const creditFall = {
    id: 'CREDIT-1',
    student_studentnumber: student.studentnumber,
    course_code: courseinstanceFall.course_code,
    attainment_date: courseinstanceFall.coursedate,
    semestercode: 123
  }

  const creditSpring = {
    id: 'CREDIT-2',
    student_studentnumber: student.studentnumber,
    course_code: courseinstanceSpring.course_code,
    attainment_date: courseinstanceSpring.coursedate,
    semestercode: 124
  }

  const semesterEnrollments = {
    fall: {
      enrollmenttype: 1,
      studentnumber: student.studentnumber,
      semestercode: semesters.fall.semestercode,
      enrollment_date: semesters.fall.startdate
    },
    spring: {
      enrollmenttype: 1,
      studentnumber: student.studentnumber,
      semestercode: semesters.spring.semestercode,
      enrollment_date: semesters.spring.startdate
    },
    current: {
      enrollmenttype: 1,
      studentnumber: student.studentnumber,
      semestercode: semesters.current.semestercode,
      enrollment_date: semesters.current.startdate
    }
  }

  const studyrightelements = {
    bsc: {
      startdate: new Date('2011-07-31 21:00:00+00'),
      enddate: Date('2016-12-20 22:00:00+00'),
      studyrightid: studyright.studyrightid,
      code: elementdetails.bsc.code,
      studentnumber: student.studentnumber
    },
    maths: {
      startdate: new Date('2011-07-31 21:00:00+00'),
      enddate: Date('2016-12-20 22:00:00+00'),
      studyrightid: studyright.studyrightid,
      code: elementdetails.maths.code,
      studentnumber: student.studentnumber
    }
  }

  describe(`
    Student with:
    - BSc studyright (2011-07-31 – 2016-12-20),
    - Mathematics studyright (2011-07-31 – 2016-12-20),
    - Two credits in 2011-09-31 and 2012-02-31.
    `, () => {
    beforeAll(async () => {
      await Semester.bulkCreate([semesters.fall, semesters.spring, semesters.current])
      await Student.create(student)
      await Course.create(courses.elements_of_ai)
      await Credit.bulkCreate([creditFall, creditSpring])
      await ElementDetails.bulkCreate([elementdetails.bsc, elementdetails.maths, elementdetails.cs])
      await StudyrightExtent.create(studyrightextents.bachelors)
      await Studyright.create(studyright)
      await StudyrightElement.bulkCreate([studyrightelements.bsc, studyrightelements.maths])
      await SemesterEnrollment.bulkCreate([
        semesterEnrollments.fall,
        semesterEnrollments.spring,
        semesterEnrollments.current
      ])
      // Mock current semester implementation
      semesterService.getCurrentSemester.mockImplementation(async () => {
        const currentSemester = await Semester.findOne({
          where: {
            semestercode: semesters.current.semestercode
          }
        })
        return currentSemester
      })
    })

    test('Query result for Mathematics, Fall 2010 for 12 months should not contain the student.', async () => {
      const query = createQueryObject('2010', SEMESTER.FALL, [elementdetails.maths.code], 12)
      const { students } = await optimizedStatisticsOf(query)
      expect(students.some(s => s.studentNumber === student.studentnumber)).toBe(false)
    })

    test('Query result for Mathematics, Fall 2012 for 12 months should not contain the student.', async () => {
      const query = createQueryObject('2012', SEMESTER.FALL, [elementdetails.maths.code], 12)
      const { students } = await optimizedStatisticsOf(query)
      expect(students.some(s => s.studentNumber === student.studentnumber)).toBe(false)
    })

    test('Query result for BSc and Computer Science, Fall 2011 for 12 months should not contain the student.', async () => {
      const query = createQueryObject('2011', SEMESTER.FALL, [elementdetails.bsc.code, elementdetails.cs.code], 12)
      const { students } = await optimizedStatisticsOf(query)
      expect(students.some(s => s.studentNumber === student.student_studentnumber)).toBe(false)
    })

    test('Query result for Mathematics, Spring 2012 for 12 months should not contain the student', async () => {
      const query = createQueryObject('2012', SEMESTER.SPRING, [elementdetails.maths.code], 12)
      const { students } = await optimizedStatisticsOf(query)
      expect(students.some(s => s.studentNumber === student.studentnumber)).toBe(false)
    })
  })
})
