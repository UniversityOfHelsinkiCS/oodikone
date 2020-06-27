import { useContext } from 'react'
import { CourseFilterContext } from './CourseFilterContext'

export default () => {
  const [state, setState] = useContext(CourseFilterContext)

  const setCourses = courses => setState(courses)

  return { courses: state, setCourses }
}
