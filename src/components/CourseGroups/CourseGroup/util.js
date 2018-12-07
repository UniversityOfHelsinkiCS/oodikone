import { bool, number, shape, string } from 'prop-types'

export const teacherType = shape({
  name: string,
  code: string,
  id: string,
  isActive: bool,
  courses: number,
  credits: number,
  students: number
})

export const academicYearType = shape({
  semestercode: number.isRequired,
  yearname: string.isRequired
})

export const CG_API_BASE_PATH = 'course-groups'
