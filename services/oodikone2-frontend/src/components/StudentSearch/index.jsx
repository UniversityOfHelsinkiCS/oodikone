import React, { useEffect, useState, Fragment } from 'react'
import { withRouter, Link, useLocation } from 'react-router-dom'
import { func, string, arrayOf, object, bool } from 'prop-types'
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
  const location = useLocation()

  const resetComponent = () => {
    setLoading(false)
    setShowResults(false)
    setSearchStr('')
  }

  useEffect(() => {
    resetComponent()
  }, [location])

  useEffect(() => {
    if (studentNumber && containsOnlyNumbers(studentNumber)) {
      setLoading(true)
      getStudent(studentNumber).then(() => resetComponent())
    }
  }, [])

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
      {
        key: 'studentnumber',
        title: 'Student number',
        getRowVal: s => s.studentNumber,
        getRowContent: s => (
          <Link
            style={{
              color: 'black',
              display: 'inline-block',
              width: '100%',
              height: '100%',
              padding: '.78571429em .78571429em'
            }}
            to={`/students/${s.studentNumber}`}
          >
            {s.studentNumber}
          </Link>
        ),
        cellProps: {
          style: {
            padding: '0'
          }
        }
      },
      {
        key: 'started',
        title: translate('common.started'),
        getRowVal: s => (s.started === 'Unavailable' ? -Infinity : moment(s.started, 'DD.MM.YYYY').unix()),
        getRowContent: s => (
          <Link
            style={{
              color: 'black',
              display: 'inline-block',
              width: '100%',
              height: '100%',
              padding: '.78571429em .78571429em'
            }}
            to={`/students/${s.studentNumber}`}
          >
            {s.started}
          </Link>
        ),
        cellProps: {
          style: {
            padding: '0'
          }
        }
      },
      {
        key: 'credits',
        title: 'Credits',
        getRowVal: s => s.credits,
        getRowContent: s => (
          <Link
            style={{
              color: 'black',
              display: 'inline-block',
              width: '100%',
              height: '100%',
              padding: '.78571429em .78571429em'
            }}
            to={`/students/${s.studentNumber}`}
          >
            {s.credits}
          </Link>
        ),
        cellProps: {
          style: {
            padding: '0'
          }
        }
      }
    ]

    if (showNames) {
      columns.push({
        key: 'lastname',
        title: 'Last names',
        getRowVal: s => s.lastname,
        getRowContent: s => (
          <Link
            style={{
              color: 'black',
              display: 'inline-block',
              width: '100%',
              height: '100%',
              padding: '.78571429em .78571429em'
            }}
            to={`/students/${s.studentNumber}`}
          >
            {s.lastname}
          </Link>
        ),
        cellProps: {
          style: {
            padding: '0'
          }
        }
      })
      columns.push({
        key: 'firstnames',
        title: 'Given names',
        getRowVal: s => s.firstnames,
        getRowContent: s => (
          <Link
            style={{
              color: 'black',
              display: 'inline-block',
              width: '100%',
              height: '100%',
              padding: '.78571429em .78571429em'
            }}
            to={`/students/${s.studentNumber}`}
          >
            {s.firstnames}
          </Link>
        ),
        cellProps: {
          style: {
            padding: '0'
          }
        }
      })
    }

    return (
      <SortableTable
        getRowKey={s => s.studentNumber}
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
