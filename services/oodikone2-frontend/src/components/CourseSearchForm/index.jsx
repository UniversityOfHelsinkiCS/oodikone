import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { func, bool } from 'prop-types'
import { Form } from 'semantic-ui-react'
import { clearCourses, findCoursesV2 } from '../../redux/coursesearch'
import AutoSubmitSearchInput from '../AutoSubmitSearchInput'

const CourseSearchForm = (props) => {
  const [courseName, setCourseName] = useState('')
  const [courseCode, setCourseCode] = useState('')

  useEffect(() => {
    props.clearCourses()
  }, [])

  const fetchCourses = () => {
    const validateParam = (param, minLength) => param && param.length >= minLength
    const isValidName = validateParam(courseName, 5)
    const isValidCode = validateParam(courseCode, 2)

    if (isValidName || isValidCode) {
      return props.findCoursesV2({ courseName, courseCode })
    }
    if (courseName.length === 0 && courseCode.length === 0) {
      props.clearCourses()
    }
    return Promise.resolve()
  }

  const { pending } = props

  return (
    <Form>
      <Form.Group widths="equal">
        <Form.Field>
          <label>Code:</label>
          <AutoSubmitSearchInput
            doSearch={fetchCourses}
            placeholder="Search by entering a course code"
            value={courseCode}
            onChange={cc => setCourseCode(cc)}
            loading={pending}
            minSearchLength={0}
          />
        </Form.Field>
        <Form.Field>
          <label>Name:</label>
          <AutoSubmitSearchInput
            doSearch={fetchCourses}
            placeholder="Search by entering a course name"
            value={courseName}
            onChange={cn => setCourseName(cn)}
            loading={pending}
            minSearchLength={0}
          />
        </Form.Field>
      </Form.Group>
    </Form>
  )
}

CourseSearchForm.propTypes = {
  findCoursesV2: func.isRequired,
  clearCourses: func.isRequired,
  pending: bool.isRequired
}

const mapStateToProps = state => ({
  pending: state.courseSearch.pending
})

export default connect(mapStateToProps, {
  findCoursesV2,
  clearCourses
})(CourseSearchForm)
