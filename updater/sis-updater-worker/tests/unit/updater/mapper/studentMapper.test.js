import { describe, expect, it } from 'vitest'

import './initTests.js'

import { studentMapper } from '@/updater/mapper.js'

describe('studentMapper', () => {
  const baseStudent = {
    last_name: 'Doe',
    first_names: 'Jane',
    student_number: '014999999',
    primary_email: 'jane@example.com',
    secondary_email: null,
    phone_number: null,
    gender_urn: 'urn:code:gender:female',
    oppija_id: 'oppija1',
    date_of_birth: '2000-01-01',
    id: 'person1',
    has_personal_identity_code: true,
    preferred_language_urn: 'urn:code:language:fi',
    citizenships: [],
  }

  it('filters out the Oodi test student', () => {
    const testStudent = { ...baseStudent, student_number: '012023965' }
    expect(studentMapper([], [], new Set())(testStudent)).toBeNull()
  })

  it('sums credits from valid, primary attainments of the student', () => {
    const attainments = [
      {
        id: 'a1',
        person_id: 'person1',
        credits: 5,
        primary: true,
        misregistration: false,
        expiryDate: new Date('2099-01-01'),
        type: 'CourseUnitAttainment',
        state: 'ATTAINED',
      },
      {
        id: 'b1',
        person_id: 'person1',
        credits: 5,
        primary: true,
        misregistration: false,
        expiryDate: new Date('2099-01-01'),
        type: 'CourseUnitAttainment',
        state: 'ATTAINED',
      },
      {
        // improved (non-primary) attainment must not be counted
        id: 'a2',
        person_id: 'person1',
        credits: 3,
        primary: false,
        misregistration: false,
        expiryDate: new Date('2099-01-01'),
        type: 'CourseUnitAttainment',
        state: 'ATTAINED',
      },
      {
        // belongs to a different student
        id: 'a3',
        person_id: 'other',
        credits: 100,
        primary: true,
        misregistration: false,
        expiryDate: new Date('2099-01-01'),
        type: 'CourseUnitAttainment',
        state: 'ATTAINED',
      },
    ]

    const result = studentMapper(attainments, [], new Set())(baseStudent)

    expect(result.creditcount).toBe(10)
    expect(result.studentnumber).toBe('014999999')
    expect(result.abbreviatedname).toBe('Doe Jane')
    expect(result.dateofuniversityenrollment).toBeNull()
  })
})
