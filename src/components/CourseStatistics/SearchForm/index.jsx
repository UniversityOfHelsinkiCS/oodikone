import React, { Component } from 'react'
import { Segment, Header, Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, bool } from 'prop-types'
import { getSemesters } from '../../../redux/semesters'
import { clearCourses, findCoursesV2 } from '../../../redux/coursesearch'
import { getCourseStats } from '../../../redux/coursestats'
import AutoSubmitSearchInput from '../../AutoSubmitSearchInput'
import CourseTable from '../CourseTable'
import { getCourseSearchResults } from '../../../selectors/courses'

const INITIAL = {
  displaycourses: false,
  coursename: '',
  coursecode: '',
  selectedcourses: {},
  fromYear: undefined,
  toYear: undefined,
  separate: false,
  discipline: undefined,
  type: undefined,
  prefilled: false
}


class SearchForm extends Component {
  state = {
    ...INITIAL
  }

  static getDerivedStateFromProps(props, state) {
    const isFirstLoad = !state.prefilled && !props.pending && props.preselectedCourse
    if (isFirstLoad) {
      const { code, start, end } = props.preselectedCourse

      const getMatchingYearSelection = (year) => {
        const matchingYear = year && props.years.find(y => y.text.startsWith(year.toString()))
        return matchingYear ? matchingYear.value : undefined
      }
      const fromYear = getMatchingYearSelection(start)
      const toYear = getMatchingYearSelection(end)

      return {
        coursecode: code,
        fromYear,
        toYear
      }
    }
    return null
  }

  componentDidMount() {
    this.props.getSemesters()
    this.props.clearCourses()
  }

  componentDidUpdate() {
    const { prefilled } = this.state
    const { preselectedCourse } = this.props
    if (!prefilled && preselectedCourse) {
      this.handlePrefilledLoad()
    }
  }

  toggleCourse = (course) => {
    course.selected = !course.selected
    const { selectedcourses } = this.state
    const isSelected = !!selectedcourses[course.code]
    if (isSelected) {
      const { [course.code]: omit, ...rest } = selectedcourses
      this.setState({ selectedcourses: rest })
    } else {
      this.setState({
        selectedcourses: {
          ...selectedcourses,
          [course.code]: { ...course, selected: true }
        }
      })
    }
  }

  handleChange = (e, target) => {
    const { name, value } = target
    this.setState({ [name]: value })
  }

  toggleCheckbox = (e, target) => {
    const { name } = target
    this.setState({ [name]: !this.state[name] })
  }

  handlePrefilledLoad = () => {
    this.setState(
      { prefilled: true },
      () => this.fetchCourses()
    )
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

  submitForm = async () => {
    const { fromYear, toYear, selectedcourses, separate } = this.state
    const params = {
      fromYear,
      toYear,
      courseCodes: Object.keys(selectedcourses),
      separate
    }
    await this.props.getCourseStats(params)
  }

  render() {
    const { years, loading, matchingCourses } = this.props
    const {
      selectedcourses,
      fromYear,
      toYear,
      separate,
      coursename,
      coursecode
    } = this.state

    const courses = matchingCourses.filter(c => !selectedcourses[c.code])

    const disabled = (!fromYear || Object.keys(selectedcourses).length === 0)
    const selected = Object.values(selectedcourses).map(course => ({ ...course, selected: true }))
    const noSelectedCourses = selected.length === 0
    const noQueryStrings = !coursename && !coursecode

    return (
      <Segment loading={loading}>
        <Form>
          <Header content="Search parameters" as="h3" />
          <Form.Group widths="equal">
            <Form.Dropdown
              label="From:"
              name="fromYear"
              options={years}
              selection
              placeholder="Select academic year"
              onChange={this.handleChange}
              value={fromYear}
            />
            <Form.Dropdown
              label="To:"
              name="toYear"
              options={years}
              selection
              placeholder="Select academic year"
              onChange={this.handleChange}
              value={toYear}
            />
          </Form.Group>
          <Form.Checkbox
            label="Separate statistics for Spring and Fall semesters"
            name="separate"
            onChange={this.toggleCheckbox}
            checked={separate}
          />
          <CourseTable
            title="Selected courses"
            hidden={noSelectedCourses}
            courses={selected}
            onSelectCourse={this.toggleCourse}
            controlIcon="remove"
          />
          <Form.Button
            type="button"
            disabled={disabled}
            fluid
            basic
            positive
            content="Fetch statistics"
            onClick={this.submitForm}
          />
          <Header content="Search for courses" />
          <div
            style={{ marginBottom: '15px' }}
            onFocus={() => this.setState({ focus: true })}
            onBlur={() => this.setState({ focus: false })}
          >
            <Form.Group widths="equal">
              <Form.Field>
                <label>Code:</label>
                <AutoSubmitSearchInput
                  doSearch={this.fetchCourses}
                  placeholder="Search by entering a course code"
                  value={coursecode}
                  onChange={cc => this.setState({ coursecode: cc })}
                  loading={this.props.coursesLoading}
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
                  loading={this.props.coursesLoading}
                  minSearchLength={0}
                />
              </Form.Field>
            </Form.Group>
            <CourseTable
              hidden={noQueryStrings}
              courses={courses}
              title="Searched courses"
              onSelectCourse={this.toggleCourse}
              controlIcon="plus"
            />
          </div>
        </Form>
      </Segment>
    )
  }
}

SearchForm.propTypes = {
  findCoursesV2: func.isRequired,
  getSemesters: func.isRequired,
  getCourseStats: func.isRequired,
  clearCourses: func.isRequired,
  matchingCourses: arrayOf(shape({})).isRequired,
  years: arrayOf(shape({})).isRequired,
  loading: bool.isRequired,
  coursesLoading: bool.isRequired,
  preselectedCourse: shape({})
}

SearchForm.defaultProps = {
  preselectedCourse: null
}

const mapStateToProps = (state) => {
  const { years = [] } = state.semesters.data
  const { pending, data } = state.courseStatistics
  const preselectedCourse = data[0]
  return {
    matchingCourses: getCourseSearchResults(state),
    years: Object.values(years).map(({ yearcode, yearname }) => ({
      key: yearcode,
      text: yearname,
      value: yearcode
    })).reverse(),
    loading: pending,
    preselectedCourse,
    coursesLoading: state.courseSearch.pending
  }
}

export default connect(mapStateToProps, {
  getSemesters,
  getCourseStats,
  clearCourses,
  findCoursesV2
})(SearchForm)
