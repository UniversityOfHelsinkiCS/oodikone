import React, { Component } from 'react'
import { Segment, Header, Form, Menu } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, bool } from 'prop-types'
import { getCourseTypes } from '../../../redux/coursetypes'
import { getCourseDisciplines } from '../../../redux/coursedisciplines'
import { getSemesters } from '../../../redux/semesters'
import { findCourses, clearCourses } from '../../../redux/coursesearch'
import { getCourseStats, clearCourseStats } from '../../../redux/coursestats'
import AutoSubmitSearchInput from '../../AutoSubmitSearchInput'
import CourseTable from '../CourseTable'

const INITIAL = {
  displaycourses: false,
  searchterm: '',
  selectedcourses: {},
  fromYear: undefined,
  toYear: undefined,
  separate: false,
  expanded: true,
  discipline: undefined,
  type: undefined,
  focus: false
}

class SearchForm extends Component {
  state = {
    ...INITIAL,
    expanded: this.props.expanded
  }

  componentDidMount() {
    this.props.clearCourses()
    this.props.getCourseTypes()
    this.props.getCourseDisciplines()
    this.props.getSemesters()
  }

  toggleCourseView = () => {
    this.setState({ displaycourses: !this.state.displaycourses })
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

  handleCourseFormChange = (e, target) => {
    const { name, value } = target
    const { type, discipline } = { ...this.state, [name]: value }
    this.setState({ type, discipline })
    if (type && discipline) {
      this.props.findCourses({ type, discipline })
    }
  }

  toggleCheckbox = (e, target) => {
    const { name } = target
    this.setState({ [name]: !this.state[name] })
  }

  toggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded })
  }

  fetchCourses = (name) => {
    const { type, discipline } = this.state
    return this.props.findCourses({ name, ...{ type, discipline } })
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
    this.setState({ ...INITIAL, expanded: false })
  }

  expandForm = () => {
    this.props.clearCourses()
    this.props.clearCourseStats()
    this.toggleExpanded()
  }

  render() {
    const { disciplines, coursetypes, years, loading } = this.props
    const { selectedcourses, fromYear, toYear, separate, focus } = this.state
    const courses = this.props.matchingCourses.map(course => ({
      ...course,
      selected: !!selectedcourses[course.code]
    }))
    const disabled = (!fromYear || Object.keys(selectedcourses).length === 0)
    const selected = Object.values(selectedcourses).map(course => ({ ...course, selected: true }))
    return !this.state.expanded
      ? (
        <Menu>
          <Menu.Item icon="search" content="New query" onClick={this.expandForm} />
        </Menu>
      ) : (
        <Segment loading={loading}>
          <Form>
            <Header content="Search parameters" as="h3" onClick={this.toggleExpanded} />
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
              hidden={selected.length === 0}
              courses={selected}
              onSelectCourse={this.toggleCourse}
            />
            <Header content="Search for courses" />
            <Form.Group
              widths="equal"
              style={{ display: 'none' }}
            >
              <Form.Dropdown
                onChange={this.handleCourseFormChange}
                value={this.state.discipline}
                label="Discipline:"
                name="discipline"
                search
                options={disciplines}
                selection
                placeholder="Select a course discipline"
              />
              <Form.Dropdown
                onChange={this.handleCourseFormChange}
                label="Type:"
                name="type"
                value={this.state.type}
                search
                options={coursetypes}
                selection
                placeholder="Select a course type"
              />
            </Form.Group>
            <div
              style={{ marginBottom: '15px' }}
              onFocus={() => this.setState({ focus: true })}
              onBlur={() => this.setState({ focus: false })}
            >
              <Form.Group widths="equal">
                <Form.Field>
                  <AutoSubmitSearchInput
                    doSearch={this.fetchCourses}
                    placeholder="Search by entering a course name"
                    value={this.state.searchterm}
                    onChange={searchterm => this.setState({ searchterm })}
                    loading={this.props.coursesLoading}
                  />
                </Form.Field>
              </Form.Group>
              <CourseTable
                onFocus={() => this.setState({ focus: true })}
                hidden={!focus}
                courses={courses}
                title="Searched courses"
                onSelectCourse={this.toggleCourse}
              />
            </div>
            <Form.Button type="button" disabled={disabled} fluid basic positive content="Fetch statistics" onClick={this.submitForm} />
          </Form>
        </Segment>
      )
  }
}

SearchForm.propTypes = {
  getCourseTypes: func.isRequired,
  getCourseDisciplines: func.isRequired,
  findCourses: func.isRequired,
  getSemesters: func.isRequired,
  getCourseStats: func.isRequired,
  clearCourses: func.isRequired,
  clearCourseStats: func.isRequired,
  disciplines: arrayOf(shape({})).isRequired,
  coursetypes: arrayOf(shape({})).isRequired,
  matchingCourses: arrayOf(shape({})).isRequired,
  years: arrayOf(shape({})).isRequired,
  loading: bool.isRequired,
  expanded: bool.isRequired,
  coursesLoading: bool.isRequired
}

const mapStateToProps = (state) => {
  const disciplines = state.courseDisciplines.data.map(({ discipline_id: id, name }) => ({
    key: id,
    value: id,
    text: name.fi || name.en
  }))
  const coursetypes = state.courseTypes.data.map(({ coursetypecode: code, name }) => ({
    key: code,
    value: code,
    text: name.fi || name.en
  }))
  const { years = [] } = state.semesters.data
  const { pending } = state.courseStats
  return {
    disciplines,
    coursetypes,
    matchingCourses: state.courseSearch.data,
    years: Object.values(years).map(({ yearcode, yearname }) => ({
      key: yearcode,
      text: yearname,
      value: yearcode
    })).reverse(),
    loading: pending,
    coursesLoading: state.courseSearch.pending
  }
}

export default connect(mapStateToProps, {
  getCourseTypes,
  getCourseDisciplines,
  findCourses,
  getSemesters,
  getCourseStats,
  clearCourses,
  clearCourseStats
})(SearchForm)
