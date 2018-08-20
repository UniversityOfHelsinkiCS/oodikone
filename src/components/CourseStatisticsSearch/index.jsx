import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { Search, Dropdown, Form, Table, Checkbox, Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import Timeout from '../Timeout'
import { getCourseTypes, getCourseDisciplines, getMultipleCourseStatistics } from '../../redux/courseStatistics'
import { findMultipleCourses, emptyCourseSearch } from '../../redux/courses'
import { makeSortCourses } from '../../selectors/courses'
import { reformatDate } from '../../common'

import style from './CourseStatisticsSearch.css'

const { func, string, arrayOf, object, shape } = PropTypes


class CourseStatisticsSearch extends Component {
  state = {
    isLoading: false,
    searchStr: '',
    type: { value: 'All', key: null },
    discipline: { value: 'All', key: null }
  }


  componentDidMount() {
    this.props.getCourseTypes()
    this.props.getCourseDisciplines()
  }

  resetComponent = () => {
    this.setState({
      isLoading: false,
      searchStr: '',
      type: { value: 'All', key: null },
      discipline: { value: 'All', key: null }
    })
  }

  handleTypeSelect = (e, { value, options }) => {
    const { key } = options.find(opt => opt.text === value)
    this.setState({ type: { value, key } }, () => this.fetchCoursesList())
  }

  handleDisciplineSelect = (e, { value, options }) => {
    const { key } = options.find(opt => opt.text === value)

    this.setState({ discipline: { value, key } }, () => this.fetchCoursesList())
  }


  handleSearchChange = (e, { value: searchStr }) => {
    const { type, discipline } = this.state
    this.props.clearTimeout('search')
    this.setState({ searchStr })
    if (!type.key && !discipline.key) {
      this.props.setTimeout('search', () => {
        this.fetchCoursesList()
      }, 250)
    }
  }

  fetchCoursesList = () => {
    const { type, discipline, searchStr } = this.state
    const { language } = this.props
    if (searchStr.length >= 3 && !type.key && !discipline.key) {
      this.setState({ isLoading: true })
      this.props.findMultipleCourses({
        searchStr,
        type: type.key,
        discipline: discipline.key
      }, language)
        .then(() => this.setState({ isLoading: false }))
    } else if (searchStr.length >= 3 || type.key || discipline.key) {
      this.setState({ isLoading: true })
      this.props.findMultipleCourses({
        searchStr: null,
        type: type.key,
        discipline: discipline.key
      }, language)
        .then(() => this.setState({ isLoading: false }))
    }
  }

  fetchSelectedCoursesStatistics = () => {
    this.props.fetchCourseStatistics()
    this.props.emptyCourseSearch()
    this.resetComponent()
  }

  renderCourseTypesDropdown = types => (
    <Dropdown
      placeholder="All"
      search
      value={this.state.type.value}
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
      value={this.state.discipline.value}
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
    const { searchStr } = this.state
    const { courseList } = this.props
    const coursesToRender = courseList.filter(c => c.name)
      .filter(c => c.name.toLocaleLowerCase()
        .includes(searchStr.toLocaleLowerCase()))
      .slice(0, 20)
      .map(c =>
        ({ values: [c.name, c.code, reformatDate(c.date, 'DD.MM.YYYY')], selected: c.selected }))
    const headers = ['Name', 'Code', 'Latest instance held', 'Select']
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
          {coursesToRender.map(course => (
            <Table.Row key={`${course.values[0]}-${course.values[1]}`}>{course.values.map(c =>
              <Table.Cell key={c}>{c}</Table.Cell>)
              .concat( // eslint-disable-line function-paren-newline
                <Table.Cell key={`${course.code}-checkbox`}>
                  <Checkbox
                    checked={course.selected}
                    key={course.code}
                    value={course.values[1]}
                    toggle
                    onChange={this.props.handleResultSelect}
                  />
                </Table.Cell>)}
            </Table.Row>))}
        </Table.Body>
      </Table>)
  }

  renderResultDropDown = () => { // unused, may delete
    const { courseList } = this.props
    const search = (options, query) =>
      options.filter(opt => opt.text.includes(query) || opt.value.includes(query))
    const coursesToRender = courseList.map(course => ({ key: course.code, value: course.code, text: course.name, description: course.code, associations: 'hello' }))
    return (
      <Dropdown
        style={{
          width: '100%',
          maxWidth: '850px'
        }}
        placeholder="Select courses"
        fluid
        multiple
        selection
        options={coursesToRender}
        search={search}
        onSearchChange={this.handleSearchChange}
      />
    )
  }

  render() {
    const { isLoading, searchStr } = this.state
    const { language, courseList } = this.props
    const { courseTypes, courseDisciplines } = this.props.courseStatistics
    const text = { en: 'All', fi: 'Kaikki', sv: 'Allt' }
    const disciplineOptions = courseDisciplines ?
      [
        { text: text[language], value: text[language] },
        ..._.orderBy(courseDisciplines.map(disc => (
          {
            text: disc.name.fi ? disc.name.fi : `Name missing (${language})`, // only finnish names available
            value: disc.name.fi ? disc.name.fi : `Name missing (${language})`,
            key: disc.discipline_id
          }
        )), 'text', 'asc')] : null

    const typeOptions = courseTypes ?
      [
        { text: text[language], value: text[language] },
        ..._.orderBy(courseTypes.map(ty => (
          {
            text: ty.name[language] ? ty.name[language] : `Name missing (${language})`,
            value: ty.name[language] ? ty.name[language] : `Name missing (${language})`,
            key: ty.coursetypecode
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
        <Button disabled={isLoading} style={{ marginTop: '14px' }} fluid onClick={this.fetchSelectedCoursesStatistics} content="Fetch statistics" />
        {courseList.length > 0 ? this.renderResultTable() : null}
        {/* this.renderResultDropDown() */}
      </div>
    )
  }
}

CourseStatisticsSearch.propTypes = {
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
  findMultipleCourses: func.isRequired,
  emptyCourseSearch: func.isRequired
}

const sortCourses = makeSortCourses()

const mapStateToProps = ({ locale, courses, settings, courseStatistics }) => ({
  language: settings.language,
  courseList: sortCourses(courses),
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value,
  courseStatistics
})

export default connect(mapStateToProps, {
  findMultipleCourses,
  getMultipleCourseStatistics,
  getCourseDisciplines,
  getCourseTypes,
  emptyCourseSearch
})(Timeout(CourseStatisticsSearch))
