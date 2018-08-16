const mapper = require('./oodi_data_mapper')

describe('studyattainment data mapping tests', () => {

  const data = {
    'attainment_status_code': 4,
    'attainment_date': '2018-05-30T21:00:00.000Z',
    'studyattainment_id': 123456789,
    'attainment_lang': null,
    'person_id': 1000002,
    'textual_assessment': null,
    'teachers': [
      {
        'teacher_id': 'TID_01',
        'person_id': 1000001,
        'short_name': 'Matti Meikäläinen',
        'last_names': 'Meikäläinen',
        'first_names': 'Matti Teppo'
      }
    ],
    'studyright_id': null,
    'semester_code': 136,
    'grade': [
      {
        'langcode': 'fi',
        'text': 'Hyv.'
      },
      {
        'langcode': 'sv',
        'text': 'Godk'
      },
      {
        'langcode': 'en',
        'text': 'Pass'
      }],
    'credits': 10,
    'expiry_date': null,
    'learningopportunity_name': [
      {
        'langcode': 'fi',
        'text': 'learningopportunity_name FI'
      },
      {
        'langcode': 'sv',
        'text': 'learningopportunity_name SV'
      },
      {
        'langcode': 'en',
        'text': 'learningopportunity_name EN'
      }
    ],
    'learningopportunity_id': 'LID_001'
  }

  describe('credit mapping tests', () => {

    const studentnumber = '0876654321'
    const credit = mapper.attainmentDataToCredit(data, studentnumber)

    describe('studyattainment date tests', () => {
      const { attainment_date } = credit
      const MAY = 4

      test('attainment date is truthy', () => {
        expect(attainment_date).toBeTruthy()
      })

      test('attainment date is instance of Date', () => {
        expect(attainment_date instanceof Date).toBe(true)
      })

      test('attainment date has correct month, year and date', () => {
        expect(attainment_date.getMonth()).toBe(MAY)
        expect(attainment_date.getFullYear()).toBe(2018)
        expect(attainment_date.getDate()).toBe(30)
      })
    })

    test('course code matches learningopportunity_id', () => {
      expect(credit.course_code).toBe('LID_001')
    })

    test('credit id should attainment id as string', () => {
      expect(credit.id).toBe('123456789')
    })

    test('studentnumber is correct', () => {
      expect(credit.student_studentnumber).toBe(studentnumber)
    })

    test('semestercode is correct', () => {
      expect(credit.semestercode).toBe(136)
    })

  })

  describe('teacher mapping tests', () => {

    const teachers = mapper.attainmentDataToTeachers(data)

    test('amount of mapped teachers is correct (1)', () => {
      expect(teachers.length).toBe(1)
    })

    test('teacher should have correct id', () => {
      expect(teachers[0].id).toBe('TID_01')
    })

  })

})

describe('semester enrollment data mapping tests', () => {

  const studentnumber = '12345678'

  const data = {
    'full_time_student': 'true',
    'yths_code': null,
    'semester_enrollment_type_code': 1,
    'absence_reason_code': null,
    'payment_amount': null,
    'yths_description': null,
    'student_union_member': 'true',
    'semester_enrollment_date': '2011-08-30T21:00:00.000Z',
    'payment_date': null,
    'semester_code': 123,
    'doctoral_current_year_estimate': null,
    'doctoral_previous_year': null
  }

  describe('mapping of enrolled data', () => {
    const mapping = mapper.semesterEnrollmentFromData(data, studentnumber)

    test('mapped semestercode should be integer 123', () => {
      expect(mapping.semestercode).toBe(123)
    })

    test('mapped enrollmenttype code should be integer 1', () => {
      expect(mapping.enrollmenttype).toBe(1)
    })

    test('mapped studentnumber should be correct', () => {
      expect(mapping.studentnumber).toBe(studentnumber)
    })

    test('mapped enrollment_date should be instance of Date', () => {
      expect(mapping.enrollment_date instanceof Date).toBe(true)
    })

    test('mapped enrollment_date should be equal to Date object with same day, month and year', () => {
      expect(mapping.enrollment_date).toEqual(new Date('2011-08-30'))
    })

  })

})

describe('semester code data mapping tests', () => {

  const data = {
    'teaching_start_date': '1950-09-14T22:00:00.000Z',
    'name': [
      {
        'langcode': 'fi',
        'text': 'Syksy 1950'
      },
      {
        'langcode': 'sv',
        'text': 'Hösten 1950'
      },
      {
        'langcode': 'en',
        'text': 'Autumn 1950'
      }
    ],
    'year_name': '1950-51',
    'enroll_end_date': '1950-09-29T22:00:00.000Z',
    'enroll_start_date': '1950-05-31T22:00:00.000Z',
    'end_date': '1950-12-30T22:00:00.000Z',
    'semester_code': 1,
    'start_date': '1900-07-31T22:20:11.000Z',
    'teaching_end_date': '1950-12-20T22:00:00.000Z',
    'year_code': 1
  }

  const semester = mapper.semesterFromData(data)

  test('semester code should be correct', () => {
    expect(semester.semestercode).toBe(1)
  })
  
  test('semester name should have all language keys set as properties', () => {
    expect(semester.name).toHaveProperty('fi')
    expect(semester.name).toHaveProperty('en')
    expect(semester.name).toHaveProperty('sv')
  })

  test('semester start and end date should be instances of Date', () => {
    expect(semester.startdate instanceof Date).toBe(true)
    expect(semester.enddate instanceof Date).toBe(true)
  })

  test('semester yearcode and yearname should be correct', () => {
    expect(semester.yearcode).toBe(1)
    expect(semester.yearname).toBe('1950-51')
  })

})