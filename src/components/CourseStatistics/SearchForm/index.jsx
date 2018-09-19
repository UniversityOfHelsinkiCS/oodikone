import React, { Component } from 'react'
import { Segment, Header, Form, Search, Table, Radio, Menu } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, string, bool } from 'prop-types'
import { getCourseTypes } from '../../../redux/coursetypes'
import { getCourseDisciplines } from '../../../redux/coursedisciplines'
import { getSemesters } from '../../../redux/semesters'
import { findCourses } from '../../../redux/coursesearch'
import { getCourseStats } from '../../../redux/coursestats'

const CourseTable = ({ courses, onSelectCourse }) => (courses.length === 0 ? null : (
  <Table>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell content="Name" />
        <Table.HeaderCell content="Code" />
        <Table.HeaderCell content="Select" />
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {courses.map(course => (
        <Table.Row key={course.code}>
          <Table.Cell content={course.name} />
          <Table.Cell content={course.code} />
          <Table.Cell>
            <Radio toggle checked={course.selected} onChange={() => onSelectCourse(course)} />
          </Table.Cell>
        </Table.Row>
        ))}
    </Table.Body>
  </Table>
))

CourseTable.propTypes = {
  courses: arrayOf(shape({ code: string, name: string, seleted: bool })).isRequired,
  onSelectCourse: func.isRequired
}

const INITIAL = {
  displaycourses: false,
  searchterm: undefined,
  selectedcourses: {},
  fromYear: undefined,
  toYear: undefined,
  separate: false,
  expanded: true
}

class SearchForm extends Component {
  state={ ...INITIAL }

  componentDidMount() {
    this.props.getCourseTypes()
    this.props.getCourseDisciplines()
    this.props.getSemesters()
  }

  toggleCourseView = () => {
    this.setState({ displaycourses: !this.state.displaycourses })
  }

  searchOnEnter = (e) => {
    if (e.key === 'Enter') {
      this.fetchCourses(this.state.searchterm)
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

  toggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded })
  }

  fetchCourses = name => this.props.findCourses({ name })

  handleSearchChange = (e, { value: searchterm }) => {
    this.setState({ searchterm })
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

  render() {
    const { disciplines, coursetypes, years, loading } = this.props
    const { selectedcourses, fromYear, toYear, separate } = this.state
    const courses = this.props.matchingCourses.map(course => ({
      ...course,
      selected: !!selectedcourses[course.code]
    }))
    const selected = Object.values(selectedcourses).map(course => ({ ...course, selected: true }))
    return !this.state.expanded
      ? (
        <Menu>
          <Menu.Item icon="search" content="New query" onClick={this.toggleExpanded} />
        </Menu>
      ) : (
        <Segment loading={loading}>
          {
            !this.state.displaycourses ? (
              <Form>
                <Header content="Search parameters" onClick={this.toggleExpanded} />
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
                    placeholder="Optional"
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
                <Header content="Selected courses" />
                <CourseTable
                  courses={selected}
                  onSelectCourse={this.toggleCourse}
                />
                <Form.Button type="button" basic fluid content="Click here to add courses to your search" onClick={this.toggleCourseView} />
                <Form.Button type="button" fluid basic primary content="Fetch statistics" onClick={this.submitForm} />
              </Form>
            ) : (
              <div>
                <Form>
                  <Header content="Select courses for search" />
                  <Form.Group widths="equal">
                    <Form.Dropdown disabled label="Discipline:" search options={disciplines} selection placeholder="Select a course discipline" />
                    <Form.Dropdown disabled label="Type:" search options={coursetypes} selection placeholder="Select a course type" />
                  </Form.Group>
                  <Form.Field>
                    <Search
                      input={{ fluid: true }}
                      placeholder="Search by entering a course code or name"
                      showNoResults={false}
                      value={this.state.searchterm}
                      onSearchChange={this.handleSearchChange}
                      onKeyPress={this.searchOnEnter}
                    />
                  </Form.Field>
                  <CourseTable
                    courses={courses}
                    onSelectCourse={this.toggleCourse}
                  />
                  <Form.Button type="button" basic fluid content="Continue" onClick={this.toggleCourseView} />
                </Form>
              </div>
            )
          }
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
  disciplines: arrayOf(shape({})).isRequired,
  coursetypes: arrayOf(shape({})).isRequired,
  matchingCourses: arrayOf(shape({})).isRequired,
  years: arrayOf(shape({})).isRequired,
  loading: bool.isRequired
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
    loading: pending
  }
}

export default connect(mapStateToProps, {
  getCourseTypes,
  getCourseDisciplines,
  findCourses,
  getSemesters,
  getCourseStats
})(SearchForm)
