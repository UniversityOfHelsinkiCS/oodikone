import React, { useEffect, useState, Fragment } from 'react'
import { withRouter } from 'react-router-dom'
import { func, string, arrayOf, object, bool, shape } from 'prop-types'
import { connect } from 'react-redux'
import { Search, Segment, Container } from 'semantic-ui-react'
import moment from 'moment'

import { findStudents, getStudent } from '../../redux/students'
import SegmentDimmer from '../SegmentDimmer'
import SortableTable from '../SortableTable'
import Timeout from '../Timeout'
import { makeFormatStudentRows } from '../../selectors/students'

import { containsOnlyNumbers, validateInputLength, splitByEmptySpace } from '../../common'

const StudentSearch = ({
  getStudent,
  clearTimeout: customClearTimeout,
  setTimeout: customSetTimeout,
  history,
  students,
  studentNumber,
  findStudents,
  translate,
  showNames,
  pending
}) => {
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchStr, setSearchStr] = useState('')

  const resetComponent = () => {
    setLoading(false)
    setShowResults(false)
    setSearchStr('')
  }

  useEffect(() => {
    if (studentNumber && containsOnlyNumbers(studentNumber)) {
      setLoading(true)
      getStudent(studentNumber).then(() => resetComponent())
    }
  }, [])

  const handleSearchSelect = student => {
    const { studentNumber } = student
    history.push(`/students/${studentNumber}`, { selected: studentNumber })
    const studentObject = students.find(person => person.studentNumber === studentNumber)
    const fetched = studentObject ? studentObject.fetched : false
    if (!fetched) {
      setLoading(true)
      getStudent(studentNumber).then(() => resetComponent())
    } else {
      resetComponent()
    }
  }

  const fetchStudentList = searchStr => {
    if (
      !splitByEmptySpace(searchStr.trim())
        .slice(0, 2)
        .find(t => validateInputLength(t, 4)) ||
      (Number(searchStr) && searchStr.trim().length < 6)
    ) {
      return
    }

    customSetTimeout(
      'fetch',
      () => {
        setLoading(true)
      },
      250
    )
    findStudents(searchStr.trim()).then(() => {
      customClearTimeout('fetch')
      setLoading(false)
      setShowResults(true)
    })
  }

  const handleSearchChange = (e, { value }) => {
    customClearTimeout('search')
    setSearchStr(value)
    if (value.length > 0) {
      customSetTimeout(
        'search',
        () => {
          fetchStudentList(value)
        },
        250
      )
    } else {
      resetComponent()
    }
  }

  const renderSearchResults = () => {
    if (!showResults || pending) {
      // so that the loading spinner doesn't go on top of the search box
      return <div style={{ margin: 100 }} />
    }
    if (students.length <= 0) {
      return <div>{translate('common.noResults')}</div>
    }

    const columns = [
      { key: 'studentNumber', title: translate('common.studentNumber'), getRowVal: s => s.studentNumber },
      {
        key: 'started',
        title: translate('common.started'),
        getRowContent: s => s.started,
        getRowVal: s => (s.started === 'Unavailable' ? -Infinity : moment(s.started, 'DD.MM.YYYY').unix())
      },
      { key: 'credits', title: translate('common.credits'), getRowVal: s => s.credits }
    ]

    if (showNames) {
      columns.push({ key: 'lastname', title: 'last names', getRowVal: s => s.lastname })
      columns.push({ key: 'firstnames', title: 'given names', getRowVal: s => s.firstnames })
    }

    return (
      <SortableTable
        getRowKey={s => s.studentNumber}
        getRowProps={s => ({
          style: { cursor: 'pointer' },
          onClick: () => handleSearchSelect(s)
        })}
        tableProps={{ celled: false }}
        columns={columns}
        data={students.slice(0, 200)}
        chunkifyBy="studentNumber"
      />
    )
  }

  if (studentNumber) {
    return null
  }

  return (
    <Fragment>
      <Container>
        <Search
          input={{ fluid: true }}
          loading={loading}
          onSearchChange={handleSearchChange}
          showNoResults={false}
          value={searchStr}
          placeholder={translate('studentStatistics.searchPlaceholder')}
        />
      </Container>
      <Segment basic>
        <SegmentDimmer translate={translate} isLoading={loading} />
        {renderSearchResults()}
      </Segment>
    </Fragment>
  )
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
