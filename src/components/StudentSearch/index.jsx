import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { func, string, arrayOf, object, bool, shape } from 'prop-types'
import { connect } from 'react-redux'
import { Search, Segment } from 'semantic-ui-react'

import { findStudents, getStudent, selectStudent } from '../../redux/students'
import SearchResultTable from '../SearchResultTable'
import SegmentDimmer from '../SegmentDimmer'
import Timeout from '../Timeout'
import { makeFormatStudentRows } from '../../selectors/students'

import sharedStyles from '../../styles/shared'
import styles from './studentSearch.css'
import { containsOnlyNumbers } from '../../common'

const DEFAULT_STATE = {
  students: [],
  isLoading: false,
  showResults: false,
  searchStr: ''
}

class StudentSearch extends Component {
  state = DEFAULT_STATE

  componentDidMount() {
    const { studentNumber } = this.props

    if (studentNumber && containsOnlyNumbers(studentNumber)) {
      this.setState({ isLoading: true })
      this.props.getStudent(studentNumber).then(() => this.resetComponent())
    }
  }

  resetComponent = () => {
    this.setState(DEFAULT_STATE)
  }

  handleSearchChange = (e, { value }) => {
    this.props.clearTimeout('search')
    if (value.length > 0) {
      this.setState({ searchStr: value })
      this.props.setTimeout('search', () => {
        this.fetchStudentList(value)
      }, 250)
    } else {
      this.resetComponent()
    }
  }

  handleSearchSelect = (e, student) => {
    const { studentNumber } = student
    this.props.history.push(`/students/${studentNumber}`, { selected: studentNumber })
    const studentObject = this.props.students.find(person =>
      person.studentNumber === studentNumber)
    const fetched = studentObject ? studentObject.fetched : false
    if (!fetched) {
      this.setState({ isLoading: true })
      this.props.getStudent(studentNumber).then(() => this.resetComponent())
    } else {
      this.props.selectStudent(studentNumber)
      this.resetComponent()
    }
  }

  fetchStudentList = (searchStr) => {
    if (searchStr.length < 4 || (Number(searchStr) && searchStr.length < 6)) {
      return
    }
    this.props.setTimeout('fetch', () => {
      this.setState({ isLoading: true })
    }, 250)
    this.props.findStudents(searchStr).then(() => {
      this.props.clearTimeout('fetch')
      this.setState({ isLoading: false, showResults: true })
    })
  }

  renderSearchResults = () => {
    const { translate, students, showNames } = this.props
    const { showResults } = this.state

    const removeNamesIfNotShown = (student) => {
      if (showNames) {
        return student
      }

      return {
        studentNumber: student.studentNumber,
        started: student.started,
        credits: student.credits
      }
    }

    if (!showResults) {
      // so that the loading spinner doesn't go on top of the search box
      return <div style={{ margin: 100 }} />
    }
    const headers = [
      translate('common.studentNumber'),
      translate('common.started'),
      translate('common.credits')
    ]

    if (showNames) {
      headers.push('last names')
      headers.push('first names')
    }

    return (
      <SearchResultTable
        headers={headers}
        rows={students.map(removeNamesIfNotShown)}
        rowClickFn={this.handleSearchSelect}
        noResultText={translate('common.noResults')}
        selectablestatic
      />
    )
  }


  render() {
    const { translate, studentNumber } = this.props


    if (studentNumber) {
      return null
    }

    const { isLoading, searchStr } = this.state

    return (
      <div className={styles.searchContainer}>
        <Search
          className={styles.studentSearch}
          input={{ fluid: true }}
          loading={isLoading}
          onSearchChange={this.handleSearchChange}
          showNoResults={false}
          value={searchStr}
          placeholder={translate('studentStatistics.searchPlaceholder')}
        />
        <Segment className={sharedStyles.contentSegment}>
          <SegmentDimmer translate={translate} isLoading={isLoading} />
          {this.renderSearchResults()}
        </Segment>
      </div>
    )
  }
}
StudentSearch.propTypes = {
  translate: func.isRequired,
  findStudents: func.isRequired,
  getStudent: func.isRequired,
  selectStudent: func.isRequired,
  studentNumber: string,
  students: arrayOf(object).isRequired,
  setTimeout: func.isRequired,
  clearTimeout: func.isRequired,
  showNames: bool.isRequired,
  history: shape({}).isRequired
}
StudentSearch.defaultProps = {
  studentNumber: undefined
}

const formatStudentRows = makeFormatStudentRows()

const mapStateToProps = ({ students, settings }) => ({
  students: formatStudentRows(students),
  showNames: settings.namesVisible,
  selected: students.selected
})

const mapDispatchToProps = dispatch => ({
  findStudents: searchStr =>
    dispatch(findStudents(searchStr)),
  getStudent: studentNumber =>
    dispatch(getStudent(studentNumber)),
  selectStudent: studentNumber =>
    dispatch(selectStudent(studentNumber))
})


export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Timeout(StudentSearch)))
