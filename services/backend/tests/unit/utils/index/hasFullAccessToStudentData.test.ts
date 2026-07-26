import { hasFullAccessToStudentData } from '../../../../src/util'
import { describe, it, assert } from 'vitest'

void describe('hasFullAccessToStudentData', () => {
  it('should return false with non-permitted roles', () => {
    assert(
      !hasFullAccessToStudentData(['courseStatistics']),
      'courseStatistics should not have full access to student data'
    )
    assert(
      !hasFullAccessToStudentData(['facultyStatistics']),
      'facultyStatistics should not have full access to student data'
    )
    assert(
      !hasFullAccessToStudentData(['studyGuidanceGroups']),
      'studyGuidanceGroups should not have full access to student data'
    )
    assert(!hasFullAccessToStudentData(['teachers']), 'teachers should not have full access to student data')
  })
  it('should return false with multiple non-permitted roles', () => {
    assert(!hasFullAccessToStudentData(['courseStatistics', 'facultyStatistics']))
    assert(!hasFullAccessToStudentData(['courseStatistics', 'facultyStatistics', 'studyGuidanceGroups', 'teachers']))
  })

  it('should return true with a permitted role', () => {
    assert(hasFullAccessToStudentData(['admin']), 'admin *should* have full access to student data')
    assert(hasFullAccessToStudentData(['fullSisuAccess']), 'fullSisuAccess *should* have full access to student data')
  })

  it('should return true with a permitted role + non-permitted roles', () => {
    assert(
      hasFullAccessToStudentData(['admin', 'courseStatistics', 'facultyStatistics']),
      'admin *should* have full access to student data'
    )
    assert(
      hasFullAccessToStudentData(['teachers', 'fullSisuAccess']),
      'fullSisuAccess *should* have full access to student data'
    )
  })
})
