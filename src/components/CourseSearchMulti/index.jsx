import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { Search, Dropdown, Form, Table, Checkbox, Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import Timeout from '../Timeout'
import { getCourseTypes, getCourseDisciplines, getMultipleCourseStatistics } from '../../redux/courseStatistics'
import { findMultipleCourses } from '../../redux/courses'
import { makeSortCourses } from '../../selectors/courses'
import { reformatDate } from '../../common'

import style from './courseSearchMulti.css'
// import sharedStyles from '../../styles/shared'

const { func, string, arrayOf, object, shape } = PropTypes


class CourseSearchMulti extends Component {
  state = {
    isLoading: false,
    searchStr: '',
    type: null,
    discipline: null
  }


  componentDidMount() {
    this.props.getCourseTypes()
    this.props.getCourseDisciplines()
  }

  resetComponent = () => {
    this.setState({
      isLoading: false,
      searchStr: ''
    })
  }

  handleTypeSelect = (e, { value }) => {
    this.setState({ type: value }, () => this.fetchCoursesList())
  }

  handleDisciplineSelect = (e, { value }) => {
    this.setState({ discipline: value }, () => this.fetchCoursesList())
  }


  handleSearchChange = (e, { value: searchStr }) => {
    this.props.clearTimeout('search')
    this.setState({ searchStr })
    this.props.setTimeout('search', () => {
      this.fetchCoursesList()
    }, 250)
  }

  fetchCoursesList = () => {
    const { type, discipline, searchStr } = this.state
    const { language } = this.props
    if (searchStr.length >= 3 || type || discipline) {
      this.setState({ isLoading: true })
      this.props.findMultipleCourses({ searchStr, type, discipline }, language)
        .then(() => this.setState({ isLoading: false }))
    } else {
      this.props.findMultipleCourses('')
    }
  }

  selectCourse = (a, b) => {
    this.setState({ searchStr: `${b.result.name} ( ${b.result.code} )` })
    this.props.handleResultSelect(a, b)
  }

  renderCourseTypesDropdown = types => (
    <Dropdown
      placeholder="All"
      search
      selection
      options={types}
      loading={types === null}
      onChange={this.handleTypeSelect}
      closeOnChange
      basic
      header="Select course type"
    />
  )

  renderDisciplinesDropdown = disciplines => (
    <Dropdown
      placeholder="All"
      search
      selection
      loading={disciplines === null}
      options={disciplines}
      onChange={this.handleDisciplineSelect}
      closeOnChange
      basic
      header="Select discipline"
    />
  )

  renderResultTable = () => {
    const { courseList } = this.props
    const coursesToRender = courseList.slice(0, 20).map(c =>
      ([c.name, c.code, reformatDate(c.date, 'DD.MM.YYYY')]))
    const headers = ['Name', 'Code', 'Latest instance held', '']

    return (
      <Table
        style={{
          width: '100%',
          maxWidth: '850px'
        }}
        unstackable
        selectable
      >
        <Table.Header>
          <Table.Row>
            {headers.map(header => (
              <Table.HeaderCell key={`header-${header}`}>
                {header}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {coursesToRender.map(course => <Table.Row key={`${course[0]}-${course[1]}`}>{course.map(c => <Table.Cell key={c}>{c}</Table.Cell>).concat(<Table.Cell key={`${course.code}-checkbox`}><Checkbox value={{ name: course[0], code: course[1] }} toggle onChange={this.props.handleResultSelect} /></Table.Cell>)}</Table.Row>)}
        </Table.Body>
      </Table>)
  }

  render() {
    const { isLoading, searchStr } = this.state
    const { language } = this.props
    const { courseTypes, courseDisciplines } = this.props.courseStatistics

    const text = { en: 'All', fi: 'Kaikki', sv: 'Allt' }
    const disciplineOptions = courseDisciplines ?
      [
        { text: text[language], value: null },
        ..._.orderBy(courseDisciplines.map(discipline => (
          {
            text: discipline.name.fi, // only finnish names available
            value: discipline.discipline_id,
            key: discipline.discipline_id
          }
        )), 'text', 'asc')] : null

    const typeOptions = courseTypes ?
      [
        { text: text[language], value: null },
        ..._.orderBy(courseTypes.map(type => (
          {
            text: type.name[language] ? type.name[language] : type.name.fi,
            value: type.coursetypecode,
            key: type.coursetypecode
          }
        )), 'text', 'asc')] : null

    return (
      <div>
        <Form>
          <Form.Group key="optionals" className={style.yearSelectorGroup}>
            <Form.Field>
              <label>Course discipline (optional)</label>
              {this.renderDisciplinesDropdown(disciplineOptions)}
            </Form.Field>
            <Form.Field>
              <label>Course type (optional)</label>
              {this.renderCourseTypesDropdown(typeOptions)}
            </Form.Field>
          </Form.Group>
        </Form>
        <Search
          input={{ fluid: true }}
          loading={isLoading}
          placeholder="Search by entering a course code or name"
          onSearchChange={this.handleSearchChange}
          value={searchStr}
          showNoResults={false}
        />
        <Button onClick={this.props.fetchCourseStatistics} content="GO" />
        {this.renderResultTable()}
      </div>
    )
  }
}

CourseSearchMulti.propTypes = {
  language: string.isRequired,
  courseList: arrayOf(object).isRequired,
  setTimeout: func.isRequired,
  clearTimeout: func.isRequired,
  handleResultSelect: func.isRequired,
  fetchCourseStatistics: func.isRequired,
  courseStatistics: shape({
    courseTypes: arrayOf(shape({})),
    courseDisciplines: arrayOf(shape({}))
  }).isRequired,
  getCourseTypes: func.isRequired,
  getCourseDisciplines: func.isRequired,
  findMultipleCourses: func.isRequired
}

const sortCourses = makeSortCourses()

const mapStateToProps = ({ locale, courses, settings, courseStatistics }) => ({
  language: settings.language,
  courseList: sortCourses(courses),
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value,
  courseStatistics
})
const mapDispatchToProps = dispatch => ({
  findMultipleCourses: (query, language) =>
    dispatch(findMultipleCourses(query, language)),
  getMultipleCourseStatistics: query =>
    dispatch(getMultipleCourseStatistics(query)),
  getCourseTypes: () =>
    dispatch(getCourseTypes()),
  getCourseDisciplines: () =>
    dispatch(getCourseDisciplines())
})

export default connect(mapStateToProps, mapDispatchToProps)(Timeout(CourseSearchMulti))
