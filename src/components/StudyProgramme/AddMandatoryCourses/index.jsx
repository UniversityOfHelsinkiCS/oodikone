import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, bool, string } from 'prop-types'
import { Header, Segment, Button, Form } from 'semantic-ui-react'
import { clearCourses, findCoursesV2 } from '../../../redux/coursesearch'
import { getCourseSearchResults } from '../../../selectors/courses'
import AutoSubmitSearchInput from '../../AutoSubmitSearchInput'
import CourseTable from '../../CourseStatistics/CourseTable'

class AddMandatoryCourses extends Component {
  static propTypes = {
    findCoursesV2: func.isRequired,
    clearCourses: func.isRequired,
    pending: bool.isRequired,
    addMandatoryCourse: func.isRequired,
    studyProgramme: string.isRequired,
    matchingCourses: arrayOf(shape({})).isRequired,
    mandatoryCourseCodes: arrayOf(string).isRequired
  }

  state = {
    visible: false,
    coursename: '',
    coursecode: ''
  }

  onSelectCourse = ({ code }) => {
    const { studyProgramme } = this.props
    this.props.addMandatoryCourse(studyProgramme, code)
  }

  toggleVisibility(visible) {
    this.setState({ visible: !visible })
  }

  fetchCourses = () => {
    const { coursename: name, coursecode: code } = this.state

    const validateParam = (param, minLength) => param && param.length >= minLength
    const isValidName = validateParam(name, 5)
    const isValidCode = validateParam(code, 2)

    if (isValidName || isValidCode) {
      return this.props.findCoursesV2({ name, code })
    }
    if (name.length === 0 && code.length === 0) {
      this.props.clearCourses()
    }
    return Promise.resolve()
  }

  render() {
    const { visible, coursename, coursecode } = this.state
    const { pending, matchingCourses, mandatoryCourseCodes } = this.props
    const noQueryStrings = !coursename && !coursecode
    const courses = matchingCourses.filter(c => !mandatoryCourseCodes.includes(c.code))

    return (
      <Segment>
        <Header>Add courses</Header>
        <Button onClick={() => this.toggleVisibility(visible)}>
          {!visible ? 'Add Courses' : 'Hide'}
        </Button>
        {visible ?
          <Form loading={pending}>
            <Form.Group widths="equal" style={{ marginTop: '15px' }}>
              <Form.Field>
                <label>Code:</label>
                <AutoSubmitSearchInput
                  doSearch={this.fetchCourses}
                  placeholder="Search by entering a course code"
                  value={coursecode}
                  onChange={cc => this.setState({ coursecode: cc })}
                  loading={pending}
                  minSearchLength={0}
                />
              </Form.Field>
              <Form.Field>
                <label>Name:</label>
                <AutoSubmitSearchInput
                  doSearch={this.fetchCourses}
                  placeholder="Search by entering a course name"
                  value={coursename}
                  onChange={cn => this.setState({ coursename: cn })}
                  loading={pending}
                  minSearchLength={0}
                />
              </Form.Field>
            </Form.Group>
            <CourseTable
              hidden={noQueryStrings || pending}
              courses={courses}
              title="Searched courses"
              onSelectCourse={this.onSelectCourse}
              controlIcon="plus"
              mandatory
            />
          </Form> :
          null
        }
      </Segment>)
  }
}

const mapStateToProps = state => ({
  matchingCourses: getCourseSearchResults(state),
  pending: state.courseSearch.pending,
  mandatoryCourseCodes: state.populationMandatoryCourses.data ?
    state.populationMandatoryCourses.data.map(man => man.code) : []
})

export default connect(mapStateToProps, {
  findCoursesV2,
  clearCourses
})(AddMandatoryCourses)
