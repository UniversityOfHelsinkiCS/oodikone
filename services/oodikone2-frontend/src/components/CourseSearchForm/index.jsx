import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, bool } from 'prop-types'
import { Form } from 'semantic-ui-react'
import { clearCourses, findCoursesV2 } from '../../redux/coursesearch'
import AutoSubmitSearchInput from '../AutoSubmitSearchInput'

class CourseSearchForm extends Component {
  state = {
    coursename: '',
    coursecode: ''
  }

  componentDidMount() {
    this.props.clearCourses()
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
    const { coursename, coursecode } = this.state
    const { pending } = this.props

    return (
      <Form>
        <Form.Group widths="equal">
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
      </Form>
    )
  }
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
