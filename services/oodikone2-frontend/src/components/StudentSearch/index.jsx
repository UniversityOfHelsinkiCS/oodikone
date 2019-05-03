import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { func, string, arrayOf, object, bool, shape } from 'prop-types'
import { connect } from 'react-redux'
import { Search, Segment, Icon } from 'semantic-ui-react'

import { findStudents, getStudent, selectStudent } from '../../redux/students'
import SegmentDimmer from '../SegmentDimmer'
import SortableTable from '../SortableTable'
import Timeout from '../Timeout'
import { makeFormatStudentRows } from '../../selectors/students'

import './studentSearch.css'
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

  handleSearchSelect = (student) => {
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

    if (!showResults) {
      // so that the loading spinner doesn't go on top of the search box
      return <div style={{ margin: 100 }} />
    }
    if (students.length <= 0) {
      return <div>{translate('common.noResults')}</div>
    }

    const columns = [
      { key: 'studentnumber', title: translate('common.studentNumber'), getRowVal: s => s.studentNumber, headerProps: { onClick: null, sorted: null } },
      { key: 'started', title: translate('common.started'), getRowVal: s => s.started, headerProps: { onClick: null, sorted: null } },
      { key: 'credits', title: translate('common.credits'), getRowVal: s => s.credits, headerProps: { onClick: null, sorted: null, colSpan: showNames ? 1 : 2 } }
    ]

    if (showNames) {
      columns.push({ key: 'lastnames', title: 'last names', getRowVal: s => s.lastname, headerProps: { onClick: null, sorted: null } })
      columns.push({ key: 'firstnames', title: 'first names', getRowVal: s => s.firstnames, headerProps: { onClick: null, sorted: null, colSpan: showNames ? 2 : 1 } })
    }
    columns.push({ key: 'icon', getRowVal: () => (<Icon name="level up alternate" />), cellProps: { collapsing: true }, headerProps: { onClick: null, sorted: null } })

    return (
      <SortableTable
        getRowKey={s => s.studentNumber}
        getRowProps={s => ({
          className: 'clickable',
          onClick: () => this.handleSearchSelect(s)
        })}
        tableProps={{ celled: false, sortable: false }}
        columns={columns}
        data={students}
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
      <div className="searchContainer">
        <Search
          className="studentSearch"
          input={{ fluid: true }}
          loading={isLoading}
          onSearchChange={this.handleSearchChange}
          showNoResults={false}
          value={searchStr}
          placeholder={translate('studentStatistics.searchPlaceholder')}
        />
        <Segment className="contentSegment">
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
