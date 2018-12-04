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
