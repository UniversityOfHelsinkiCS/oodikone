import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Table, Form, Input, Popup, Button, Segment, Icon, Item } from 'semantic-ui-react'
import { func, arrayOf, object, number, shape, string, oneOf, bool } from 'prop-types'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { replace, sortBy, orderBy, omit } from 'lodash'
import { withRouter, Link } from 'react-router-dom'

import { setPopulationFilter, removePopulationFilterOfCourse } from '../../redux/populationFilters'
import { clearCourseStats } from '../../redux/coursestats'

import { courseParticipation } from '../../populationFilters'
import PassingSemesters from './PassingSemesters'

import './populationCourseStats.css'
import { getTextIn } from '../../common'
import TSA from '../../common/tsa'

const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent('Population statistics', action, name, value)

export const tableColumnNames = {
  STUDENTS: 'students',
  PASSED: 'passed',
  RETRY_PASSED: 'retryPassed',
  PERCENTAGE: 'percentage',
  FAILED: 'failed',
  FAILED_MANY: 'failedMany',
  ATTEMPTS: 'attempts',
  PER_STUDENT: 'perStudent',
  PASSED_OF_POPULATION: 'passedOfPopulation',
  TRIED_OF_POPULATION: 'triedOfPopulation'
}

export const sortOrderTypes = {
  ASC: 'ascending',
  DESC: 'descending'
}

const lodashSortOrderTypes = {
  ASC: 'asc',
  DESC: 'desc'
}

const SortableHeaderCell = ({ content, columnName, onClickFn, activeSortColumn, reversed, rowSpan }) => {
  const isTableSortedBy = activeSortColumn === columnName
  const direction = reversed ? sortOrderTypes.DESC : sortOrderTypes.ASC
  return (
    <Table.HeaderCell
      rowSpan={`${rowSpan}`}
      sorted={isTableSortedBy ? direction : null}
      onClick={() => onClickFn(columnName)}
      className={isTableSortedBy ? 'activeSortHeader' : ''}
      content={content}
    />
  )
}

const tableColumnType = oneOf(Object.values(tableColumnNames))

SortableHeaderCell.propTypes = {
  content: string.isRequired,
  columnName: tableColumnType.isRequired,
  activeSortColumn: tableColumnType.isRequired,
  reversed: bool.isRequired,
  onClickFn: func.isRequired,
  rowSpan: number
}

SortableHeaderCell.defaultProps = {
  rowSpan: 1
}

const formatGradeDistribution = grades =>
  replace(
    JSON.stringify(
      sortBy(Object.entries(grades).map(([key, value]) => ({ [key]: value.count })), o => -Object.keys(o)),
      null,
      1
    ),
    /\[\n|{\n*|{\s|}|\s*}|]|"|,/g,
    ''
  )

class PopulationCourseStats extends Component {
  static propTypes = {
    courses: shape({
      coursestatistics: arrayOf(object),
      coursetypes: shape({}),
      disciplines: shape({})
    }).isRequired,
    translate: func.isRequired,
    setPopulationFilter: func.isRequired,
    populationCourses: shape({
      data: shape({ coursestatistics: arrayOf(shape({ course: shape({ code: string, name: shape({}) }) })) })
    }).isRequired,
    selectedCourses: arrayOf(object).isRequired,
    removePopulationFilterOfCourse: func.isRequired,
    history: shape({}).isRequired,
    clearCourseStats: func.isRequired,
    language: string.isRequired,
    pending: bool.isRequired,
    selectedStudents: arrayOf(string).isRequired,
    years: shape({}) // eslint-disable-line
  }

  static getDerivedStateFromProps(props, state) {
    if (state && props.courses) {
      const studentAmountLimit =
        state.selectedStudentsLength !== props.selectedStudents.length
          ? Math.round(props.selectedStudents.length * 0.3)
          : state.studentAmountLimit
      return {
        ...state,
        courseStatistics: PopulationCourseStats.updateCourseStatisticsCriteria(props, state),
        initialSortReady: true,
        studentAmountLimit,
        selectedStudentsLength: props.selectedStudents.length
      }
    }

    return null
  }

  static updateCourseStatisticsCriteria(props, state) {
    const { studentAmountLimit, sortCriteria, codeFilter, reversed } = state
    const {
      courses: { coursestatistics }
    } = props

    const studentAmountFilter = ({ stats }) => {
      const { students } = stats
      return studentAmountLimit === 0 || students >= studentAmountLimit
    }
    const courseCodeFilter = ({ course }) => {
      const { code } = course
      return code.toLowerCase().includes(codeFilter.toLowerCase())
    }

    const filteredCourses =
      coursestatistics && coursestatistics.filter(studentAmountFilter).filter(c => !codeFilter || courseCodeFilter(c))

    const lodashSortOrder = reversed ? lodashSortOrderTypes.DESC : lodashSortOrderTypes.ASC

    const courseStatistics = orderBy(
      filteredCourses,
      [course => course.stats[sortCriteria], course => course.course.code],
      [lodashSortOrder, lodashSortOrderTypes.ASC]
    )

    return courseStatistics
  }

  state = {
    sortCriteria: tableColumnNames.STUDENTS,
    reversed: true,
    studentAmountLimit: Math.round(this.props.selectedStudents.length * 0.3),
    codeFilter: '',
    activeView: null,
    selectedStudentsLength: 0
  }

  onCodeFilterChange = e => {
    const {
      target: { value }
    } = e
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.setState({ codeFilter: value })
    }, 1000)
  }

  onSetCodeFilterKeyPress = e => {
    const { key } = e
    const enterKey = 'Enter'
    const isEnterKeyPress = key === enterKey
    if (isEnterKeyPress) {
      this.handleCourseStatisticsCriteriaChange()
    }
  }

  onStudentAmountLimitChange = e => {
    const {
      target: { value }
    } = e
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      sendAnalytics(
        'Courses of Population student count filter change',
        'Courses of Population student count filter change',
        value
      )
      this.setState({ studentAmountLimit: value }, () => this.handleCourseStatisticsCriteriaChange())
    }, 1000)
  }

  onSortableColumnHeaderClick = criteria => {
    const { reversed, sortCriteria } = this.state
    const isActiveSortCriteria = sortCriteria === criteria
    const isReversed = isActiveSortCriteria ? !reversed : reversed

    this.setState(
      {
        sortCriteria: criteria,
        reversed: isReversed
      },
      () => this.handleCourseStatisticsCriteriaChange()
    )
  }

  onGoToCourseStatisticsClick = () => {
    const { clearCourseStats: clearCourseStatsfn } = this.props
    clearCourseStatsfn()
  }

  onCourseNameCellClick = code => {
    const courseStatistic = this.props.populationCourses.data.coursestatistics.find(cs => cs.course.code === code)
    if (courseStatistic) {
      if (!this.isActiveCourse(courseStatistic.course)) {
        const params = { course: courseStatistic, field: 'all' }
        this.props.setPopulationFilter(courseParticipation(params))
        sendAnalytics('Courses of Population course selected for filter', code)
      } else {
        this.props.removePopulationFilterOfCourse(courseStatistic.course)
        sendAnalytics('Courses of Population course unselected for filter', code)
      }
    }
  }

  setActiveView = activeView => this.setState({ activeView })

  handleCourseStatisticsCriteriaChange = () => {
    // eslint-disable-next-line react/no-access-state-in-setstate
    const courseStatistics = PopulationCourseStats.updateCourseStatisticsCriteria(this.props, this.state)
    this.setState({ courseStatistics })
  }

  isActiveCourse = course => {
    const { selectedCourses } = this.props
    return selectedCourses.length > 0 && selectedCourses.find(c => course.code === c.code) !== undefined
  }

  renderCodeFilterInputHeaderCell = () => {
    const { translate } = this.props
    return (
      <Table.HeaderCell>
        {translate('populationCourses.code')}
        <Input
          className="courseCodeInput"
          transparent
          placeholder="(filter here)"
          onChange={this.onCodeFilterChange}
          onKeyPress={this.onSetCodeFilterKeyPress}
        />
      </Table.HeaderCell>
    )
  }

  renderActiveView() {
    const { courseStatistics } = this.state

    switch (this.state.activeView) {
      case 'showGradeDistribution':
        return this.renderGradeDistributionTable(courseStatistics)
      case 'passingSemester':
        return (
          <PassingSemesters
            courseStatistics={courseStatistics}
            onCourseNameClickFn={this.onCourseNameCellClick}
            isActiveCourseFn={this.isActiveCourse}
          />
        )
      default:
        return this.renderBasicTable(courseStatistics)
    }
  }

  renderGradeDistributionTable = courseStatistics => {
    const { translate, language } = this.props
    const { sortCriteria, reversed } = this.state

    const courseGradesTypes = [1, 2, 3, 4, 5]

    const getTableHeader = () => (
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.course')} />
          {this.renderCodeFilterInputHeaderCell()}
          <SortableHeaderCell
            content="Attempts"
            columnName={tableColumnNames.STUDENTS}
            onClickFn={this.onSortableColumnHeaderClick}
            activeSortColumn={sortCriteria}
            reversed={reversed}
          />
          <Table.HeaderCell content={0} />
          {courseGradesTypes.map(g => (
            <Table.HeaderCell content={g} key={g} />
          ))}
          <Table.HeaderCell content="Other passed" />
        </Table.Row>
      </Table.Header>
    )

    const getCourseRow = courseStats => {
      const { course, grades } = courseStats
      const { name, code } = course

      let attempts = 0
      let failedGrades = 0
      let otherPassed = 0

      if (grades) {
        const countSumReducer = (acc, cur) => acc + cur.count
        const gradeValues = grades ? Object.values(grades) : null
        attempts = gradeValues.reduce(countSumReducer, 0)
        failedGrades = gradeValues.filter(g => g.status.failingGrade).reduce(countSumReducer, 0)
        otherPassed = Object.values(omit(grades, courseGradesTypes))
          .filter(g => g.status.passingGrade || g.status.improvedGrade)
          .reduce(countSumReducer, 0)
      }
      return (
        <Table.Row active={this.isActiveCourse(course)}>
          <Table.Cell
            onClick={() => this.onCourseNameCellClick(code)}
            content={getTextIn(name, language)}
            className="clickableCell"
          />
          <Table.Cell className="iconCell">
            <p>
              <Item
                as={Link}
                to={`/coursestatistics?courseCodes=["${encodeURIComponent(
                  code
                )}"]&separate=false&unifyOpenUniCourses=false`}
              >
                <Icon name="level up alternate" onClick={() => this.onGoToCourseStatisticsClick()} />
              </Item>
            </p>
          </Table.Cell>
          <Table.Cell content={code} />
          <Table.Cell content={attempts} />
          <Table.Cell content={failedGrades} />
          {courseGradesTypes.map(g => (
            <Table.Cell content={grades[g] ? grades[g].count || 0 : 0} key={code + g} />
          ))}
          <Table.Cell content={otherPassed} />
        </Table.Row>
      )
    }

    const getCoursePopUpRow = courseStats => {
      const { course, grades } = courseStats
      const { code } = course
      return (
        <Popup
          key={code}
          flowing
          hoverable
          inverted
          position="top right"
          hideOnScroll
          content={grades ? <pre>{formatGradeDistribution(grades)}</pre> : 'Nothing to see here'}
          trigger={getCourseRow(courseStats)}
        />
      )
    }

    return (
      <Table celled sortable className="fixed-header">
        {getTableHeader()}
        <Table.Body>{courseStatistics.map(getCoursePopUpRow)}</Table.Body>
      </Table>
    )
  }

  renderBasicTable = courseStatistics => {
    const { translate, language } = this.props
    const { sortCriteria, reversed } = this.state

    const getSortableHeaderCell = (label, columnName, rowSpan = 1) => (
      <SortableHeaderCell
        content={label}
        columnName={columnName}
        onClickFn={this.onSortableColumnHeaderClick}
        activeSortColumn={sortCriteria}
        reversed={reversed}
        rowSpan={rowSpan}
      />
    )

    const getTableHeader = () => (
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan="3" content={translate('populationCourses.course')} />
          {getSortableHeaderCell(translate('populationCourses.students'), tableColumnNames.STUDENTS, 2)}
          <Table.HeaderCell colSpan="3" content={translate('populationCourses.passed')} />
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.failed')} />
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.attempts')} />
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.percentageOfPopulation')} />
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell colSpan="2" content={translate('populationCourses.name')} />
          {this.renderCodeFilterInputHeaderCell()}
          {getSortableHeaderCell(translate('populationCourses.number'), tableColumnNames.PASSED)}
          {getSortableHeaderCell(translate('populationCourses.passedAfterRetry'), tableColumnNames.RETRY_PASSED)}
          {getSortableHeaderCell(translate('populationCourses.percentage'), tableColumnNames.PERCENTAGE)}
          {getSortableHeaderCell(translate('populationCourses.number'), tableColumnNames.FAILED)}
          {getSortableHeaderCell(translate('populationCourses.failedManyTimes'), tableColumnNames.FAILED_MANY)}
          {getSortableHeaderCell(translate('populationCourses.number'), tableColumnNames.ATTEMPTS)}
          {getSortableHeaderCell(translate('populationCourses.perStudent'), tableColumnNames.PER_STUDENT)}
          {getSortableHeaderCell(translate('populationCourses.passed'), tableColumnNames.PASSED_OF_POPULATION)}
          {getSortableHeaderCell(translate('populationCourses.attempted'), tableColumnNames.TRIED_OF_POPULATION)}
        </Table.Row>
      </Table.Header>
    )

    const getCourseRow = courseStats => {
      const { course, stats } = courseStats
      const { code, name } = course
      const {
        failed,
        passed,
        retryPassed,
        failedMany,
        attempts,
        percentage,
        perStudent,
        passedOfPopulation,
        triedOfPopulation
      } = stats
      return (
        <Table.Row key={code} active={this.isActiveCourse(course)}>
          <Table.Cell
            onClick={() => this.onCourseNameCellClick(code)}
            content={getTextIn(name, language)}
            className="clickableCell"
          />
          <Table.Cell className="iconCell">
            <p>
              <Item
                as={Link}
                to={`/coursestatistics?courseCodes=["${encodeURIComponent(
                  code
                )}"]&separate=false&unifyOpenUniCourses=false`}
              >
                <Icon name="level up alternate" onClick={() => this.onGoToCourseStatisticsClick()} />
              </Item>
            </p>
          </Table.Cell>
          <Table.Cell content={code} />
          <Table.Cell content={passed + failed} />
          <Table.Cell content={passed} />
          <Table.Cell content={retryPassed} />
          <Table.Cell content={`${percentage.toFixed(2)} %`} />
          <Table.Cell content={failed} />
          <Table.Cell content={failedMany} />
          <Table.Cell content={attempts} />
          <Table.Cell content={perStudent.toFixed(2)} />
          <Table.Cell content={`${passedOfPopulation.toFixed(2)}  %`} />
          <Table.Cell content={`${triedOfPopulation.toFixed(2)}  %`} />
        </Table.Row>
      )
    }

    return (
      <Table className="fixed-header" celled sortable>
        {getTableHeader()}
        <Table.Body>{courseStatistics.map(getCourseRow)}</Table.Body>
      </Table>
    )
  }

  render() {
    const { courses, translate, pending, history } = this.props
    const { studentAmountLimit } = this.state
    if (!courses) {
      return null
    }
    if (pending) {
      return null
    }
    return (
      <div>
        <Form>
          <Form.Field inline>
            <label>{translate('populationCourses.limit')}</label>
            <Input defaultValue={studentAmountLimit} onChange={this.onStudentAmountLimitChange} />
            {['/coursepopulation', '/custompopulation'].includes(history.location.pathname) ? null : (
              <Button
                active={this.state.activeView === 'passingSemester'}
                floated="right"
                onClick={() => {
                  this.setActiveView('passingSemester')
                  sendAnalytics('Courses of Population view button clicked', 'when passed')
                }}
              >
                when passed
              </Button>
            )}
            <Button
              active={this.state.activeView === 'showGradeDistribution'}
              floated="right"
              onClick={() => {
                this.setActiveView('showGradeDistribution')
                sendAnalytics('Courses of Population view button clicked', 'grades')
              }}
            >
              grades
            </Button>
            <Button
              active={this.state.activeView === null}
              floated="right"
              onClick={() => {
                this.setActiveView(null)
                sendAnalytics('Courses of Population view button clicked', 'pass/fail')
              }}
            >
              pass/fail
            </Button>
          </Form.Field>
        </Form>
        <Segment basic style={{ overflowY: 'auto', maxHeight: '80vh', padding: 0 }}>
          {this.renderActiveView()}
        </Segment>
      </div>
    )
  }
}

const mapStateToProps = state => {
  const { years } = state.semesters.data
  const courseFilters = state.populationFilters.filters.filter(f => f.type === 'CourseParticipation')
  const selectedCourses = courseFilters.map(f => f.params.course.course)
  return {
    language: getActiveLanguage(state.localize).code,
    translate: getTranslate(state.localize),
    years,
    selectedCourses,
    populationCourses: state.populationCourses
  }
}

export default connect(
  mapStateToProps,
  {
    setPopulationFilter,
    removePopulationFilterOfCourse,
    clearCourseStats
  }
)(withRouter(PopulationCourseStats))
