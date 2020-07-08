import React, { useState } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, bool, string } from 'prop-types'
import { Header, Segment, Button, Form } from 'semantic-ui-react'
import { clearCourses, findCoursesV2 } from '../../../redux/coursesearch'
import { getCourseSearchResults } from '../../../selectors/courses'
import AutoSubmitSearchInput from '../../AutoSubmitSearchInput'
import CourseTable from '../../CourseStatistics/CourseTable'

const AddMandatoryCourses = ({
  studyProgramme,
  addMandatoryCourse,
  clearCourses,
  findCoursesV2,
  pending,
  matchingCourses,
  mandatoryCourseCodes
}) => {
  const [visible, setVisible] = useState(false)
  const [coursename, setCoursename] = useState('')
  const [coursecode, setCoursecode] = useState('')

  const onSelectCourse = ({ code }) => {
    addMandatoryCourse(studyProgramme, code)
  }

  const fetchCourses = () => {
    const validateParam = (param, minLength) => param && param.length >= minLength
    const isValidName = validateParam(coursename, 5)
    const isValidCode = validateParam(coursecode, 2)

    if (isValidName || isValidCode) {
      return findCoursesV2({ name: coursename, code: coursecode })
    }
    if (coursename.length === 0 && coursecode.length === 0) {
      clearCourses()
    }
    return Promise.resolve()
  }

  const noQueryStrings = !coursename && !coursecode
  const courses = matchingCourses.filter(c => !mandatoryCourseCodes.includes(c.code))

  return (
    <Segment>
      <Header>Add courses</Header>
      <Button onClick={() => setVisible(!visible)}>{!visible ? 'Add Courses' : 'Hide'}</Button>
      {visible ? (
        <Form loading={pending}>
          <Form.Group widths="equal" style={{ marginTop: '15px' }}>
            <Form.Field>
              <label>Name:</label>
              <AutoSubmitSearchInput
                doSearch={fetchCourses}
                placeholder="Search by entering a course name"
                value={coursename}
                onChange={cn => setCoursename(cn)}
                loading={pending}
                minSearchLength={0}
              />
            </Form.Field>
            <Form.Field>
              <label>Code:</label>
              <AutoSubmitSearchInput
                doSearch={fetchCourses}
                placeholder="Search by entering a course code"
                value={coursecode}
                onChange={cc => setCoursecode(cc)}
                loading={pending}
                minSearchLength={0}
              />
            </Form.Field>
          </Form.Group>
          <CourseTable
            hidden={noQueryStrings || pending}
            courses={courses}
            title="Searched courses"
            onSelectCourse={onSelectCourse}
            controlIcon="plus"
            mandatory
          />
        </Form>
      ) : null}
    </Segment>
  )
}

AddMandatoryCourses.propTypes = {
  findCoursesV2: func.isRequired,
  clearCourses: func.isRequired,
  pending: bool.isRequired,
  addMandatoryCourse: func.isRequired,
  studyProgramme: string.isRequired,
  matchingCourses: arrayOf(shape({})).isRequired,
  mandatoryCourseCodes: arrayOf(string).isRequired
}

const mapStateToProps = state => ({
  matchingCourses: getCourseSearchResults(state).courses,
  pending: state.courseSearch.pending,
  mandatoryCourseCodes: state.populationMandatoryCourses.data
    ? state.populationMandatoryCourses.data.map(man => man.code)
    : []
})

export default connect(
  mapStateToProps,
  {
    findCoursesV2,
    clearCourses
  }
)(AddMandatoryCourses)
