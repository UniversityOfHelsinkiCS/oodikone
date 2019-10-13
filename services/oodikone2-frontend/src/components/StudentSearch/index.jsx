import React, { Component, Fragment } from 'react'
import { withRouter } from 'react-router-dom'
import { func, string, arrayOf, object, bool, shape } from 'prop-types'
import { connect } from 'react-redux'
import { Search, Segment, Container } from 'semantic-ui-react'

import { findStudents, getStudent } from '../../redux/students'
import SegmentDimmer from '../SegmentDimmer'
import SortableTable from '../SortableTable'
import Timeout from '../Timeout'
import { makeFormatStudentRows } from '../../selectors/students'

import { containsOnlyNumbers, validateInputLength, splitByEmptySpace } from '../../common'

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
      this.props.setTimeout(
        'search',
        () => {
          this.fetchStudentList(value)
        },
        250
      )
    } else {
      this.resetComponent()
    }
  }

  handleSearchSelect = student => {
    const { studentNumber } = student
    this.props.history.push(`/students/${studentNumber}`, { selected: studentNumber })
    const studentObject = this.props.students.find(person => person.studentNumber === studentNumber)
    const fetched = studentObject ? studentObject.fetched : false
    if (!fetched) {
      this.setState({ isLoading: true })
      this.props.getStudent(studentNumber).then(() => this.resetComponent())
    } else {
      this.resetComponent()
    }
  }

  fetchStudentList = searchStr => {
    if (
      !splitByEmptySpace(searchStr.trim())
        .slice(0, 2)
        .find(t => validateInputLength(t, 4)) ||
      (Number(searchStr) && searchStr.trim().length < 6)
    ) {
      return
    }

    this.props.setTimeout(
      'fetch',
      () => {
        this.setState({ isLoading: true })
      },
      250
    )
    this.props.findStudents(searchStr.trim()).then(() => {
      this.props.clearTimeout('fetch')
      this.setState({ isLoading: false, showResults: true })
    })
  }

  renderSearchResults = () => {
    const { translate, students, showNames, pending } = this.props
    const { showResults } = this.state

    if (!showResults || pending) {
      // so that the loading spinner doesn't go on top of the search box
      return <div style={{ margin: 100 }} />
    }
    if (students.length <= 0) {
      return <div>{translate('common.noResults')}</div>
    }

    const columns = [
      { key: 'studentnumber', title: translate('common.studentNumber'), getRowVal: s => s.studentNumber },
      { key: 'started', title: translate('common.started'), getRowVal: s => s.started },
      { key: 'credits', title: translate('common.credits'), getRowVal: s => s.credits }
    ]

    if (showNames) {
      columns.push({ key: 'lastnames', title: 'last names', getRowVal: s => s.lastname })
      columns.push({ key: 'firstnames', title: 'given names', getRowVal: s => s.firstnames })
    }

    return (
      <SortableTable
        getRowKey={s => s.studentNumber}
        getRowProps={s => ({
          style: { cursor: 'pointer' },
          onClick: () => this.handleSearchSelect(s)
        })}
        tableProps={{ celled: false }}
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
      <Fragment>
        <Container>
          <Search
            input={{ fluid: true }}
            loading={isLoading}
            onSearchChange={this.handleSearchChange}
            showNoResults={false}
            value={searchStr}
            placeholder={translate('studentStatistics.searchPlaceholder')}
          />
        </Container>
        <Segment basic>
          <SegmentDimmer translate={translate} isLoading={isLoading} />
          {this.renderSearchResults()}
        </Segment>
      </Fragment>
    )
  }
}
StudentSearch.propTypes = {
  translate: func.isRequired,
  findStudents: func.isRequired,
  getStudent: func.isRequired,
  studentNumber: string,
  students: arrayOf(object).isRequired,
  setTimeout: func.isRequired,
  clearTimeout: func.isRequired,
  showNames: bool.isRequired,
  history: shape({}).isRequired,
  pending: bool.isRequired
}
StudentSearch.defaultProps = {
  studentNumber: undefined
}

const formatStudentRows = makeFormatStudentRows()

const mapStateToProps = ({ students, settings }) => ({
  students: formatStudentRows(students),
  showNames: settings.namesVisible,
  selected: students.selected,
  pending: students.pending
})

const mapDispatchToProps = dispatch => ({
  findStudents: searchStr => dispatch(findStudents(searchStr)),
  getStudent: studentNumber => dispatch(getStudent(studentNumber))
})

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Timeout(StudentSearch))
)
