const mapper = require('./oodi_data_mapper')

describe('studyattainment data mapping to credit tests', () => {

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

  const credit = mapper.attainmentDataToCredit(data)

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