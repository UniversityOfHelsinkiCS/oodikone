import moment from 'moment'
import { arrayOf, bool, func, object, string } from 'prop-types'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { Container, Search, Segment } from 'semantic-ui-react'

import { containsOnlyNumbers, splitByEmptySpace, validateInputLength } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { SortableTable } from '@/components/SortableTable'
import { Timeout } from '@/components/Timeout'
import { findStudents, getStudent } from '@/redux/students'
import { makeFormatStudentRows } from '@/selectors/students'

const StudentSearch = ({
  clearTimeout: customClearTimeout,
  findStudents,
  getStudent,
  pending,
  setTimeout: customSetTimeout,
  showNames,
  studentNumber,
  students,
}) => {
  const { getTextIn } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchString, setSearchString] = useState('')
  const location = useLocation()
  const resetComponent = () => {
    setLoading(false)
    setShowResults(false)
    setSearchString('')
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

  const fetchStudentList = searchString => {
    if (
      !splitByEmptySpace(searchString.trim())
        .slice(0, 2)
        .find(t => validateInputLength(t, 4)) ||
      (Number(searchString) && searchString.trim().length < 6)
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
    findStudents(searchString.trim()).then(() => {
      customClearTimeout('fetch')
      setLoading(false)
      setShowResults(true)
    })
  }

  const handleSearchChange = (_event, { value }) => {
    customClearTimeout('search')
    setSearchString(value)
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

  const getStudyrights = student => {
    if (student.studyrights) {
      const elements = student.studyrights
        .filter(studyright => studyright.active && !studyright.graduated)
        .reduce(
          (res, studyright) => [
            ...res,
            ...studyright.studyright_elements.map(element => getTextIn(element.element_detail.name)),
          ],
          []
        )
      const sorted = elements.sort()
      return sorted.reduce((res, name) => `${res}; ${name}`, '').slice(1)
    }
    return ''
  }

  const renderSearchResults = () => {
    if (!showResults || pending) {
      return <div style={{ margin: 100 }} />
    }

    if (students.length <= 0) {
      return <div>No search results or search term is not accurate enough</div>
    }

    const studentsSorted = students.sort((a, b) => {
      let aDateSplit = a.started.split('.')
      let bDateSplit = b.started.split('.')
      let aDate
      let bDate
      if (aDateSplit[0] === 'Unavailable') {
        aDateSplit = null
      } else {
        aDate = new Date(aDateSplit[2], aDateSplit[1], aDateSplit[0])
      }
      if (bDateSplit[0] === 'Unavailable') {
        bDateSplit = null
      } else {
        bDate = new Date(bDateSplit[2], bDateSplit[1], bDateSplit[0])
      }
      if (aDate && bDate) {
        return bDate - aDate
      }
      if (aDate && !bDate) {
        return -1
      }
      return 0
    })

    const columns = [
      {
        key: 'studentnumber',
        title: 'Student number',
        getRowVal: student => student.studentNumber,
        getRowContent: student => (
          <Link
            style={{
              color: 'black',
              display: 'inline-block',
              height: '100%',
              padding: '.78571429em .78571429em',
              width: '100%',
            }}
            to={`/students/${student.studentNumber}`}
          >
            {student.studentNumber}
          </Link>
        ),
        cellProps: {
          style: {
            padding: '0',
          },
        },
      },
      {
        key: 'started',
        title: 'Started',
        getRowVal: student =>
          student.started === 'Unavailable' ? -Infinity : moment(student.started, 'DD.MM.YYYY').unix(),
        getRowContent: student => (
          <Link
            style={{
              color: 'black',
              display: 'inline-block',
              height: '100%',
              padding: '.78571429em .78571429em',
              width: '100%',
            }}
            to={`/students/${student.studentNumber}`}
          >
            {student.started}
          </Link>
        ),
        cellProps: {
          style: {
            padding: '0',
          },
        },
      },
      {
        key: 'credits',
        title: 'Credits',
        getRowVal: student => student.credits,
        getRowContent: student => (
          <Link
            style={{
              color: 'black',
              display: 'inline-block',
              height: '100%',
              padding: '.78571429em .78571429em',
              width: '100%',
            }}
            to={`/students/${student.studentNumber}`}
          >
            {student.credits}
          </Link>
        ),
        cellProps: {
          style: {
            padding: '0',
          },
        },
      },
      {
        key: 'studyrights',
        title: 'Active studyrights',
        getRowVal: student => getStudyrights(student),
        getRowContent: student => getStudyrights(student),
        cellProps: {
          style: {
            padding: '2',
          },
        },
      },
    ]

    if (showNames) {
      const nameColumns = [
        {
          key: 'lastname',
          title: 'Last names',
          getRowVal: student => student.lastname,
          getRowContent: student => (
            <Link
              style={{
                color: 'black',
                display: 'inline-block',
                height: '100%',
                padding: '.78571429em .78571429em',
                width: '100%',
              }}
              to={`/students/${student.studentNumber}`}
            >
              {student.lastname}
            </Link>
          ),
          cellProps: {
            style: {
              padding: '0',
            },
          },
        },
        {
          key: 'firstnames',
          title: 'Given names',
          getRowVal: student => student.firstnames,
          getRowContent: student => (
            <Link
              style={{
                color: 'black',
                display: 'inline-block',
                height: '100%',
                padding: '.78571429em .78571429em',
                width: '100%',
              }}
              to={`/students/${student.studentNumber}`}
            >
              {student.firstnames}
            </Link>
          ),
          cellProps: {
            style: {
              padding: '0',
            },
          },
        },
      ]
      columns.splice(0, 0, ...nameColumns)
    }

    return <SortableTable columns={columns} data={studentsSorted.slice(0, 200)} hideHeaderBar />
  }

  if (studentNumber) {
    return null
  }

  return (
    <>
      <Container>
        <Search
          input={{ fluid: true }}
          loading={loading}
          onSearchChange={handleSearchChange}
          placeholder="Search with a student number or name (surname firstname)"
          showNoResults={false}
          value={searchString}
        />
      </Container>
      <Segment basic>
        <SegmentDimmer isLoading={loading} />
        {renderSearchResults()}
      </Segment>
    </>
  )
}

StudentSearch.propTypes = {
  clearTimeout: func.isRequired,
  findStudents: func.isRequired,
  getStudent: func.isRequired,
  pending: bool.isRequired,
  setTimeout: func.isRequired,
  showNames: bool.isRequired,
  studentNumber: string,
  students: arrayOf(object).isRequired,
}

StudentSearch.defaultProps = {
  studentNumber: undefined,
}

const formatStudentRows = makeFormatStudentRows()

const mapStateToProps = ({ students, settings }) => ({
  selected: students.selected,
  showNames: settings.namesVisible,
  students: formatStudentRows(students),
  pending: students.pending,
})

const mapDispatchToProps = dispatch => ({
  findStudents: searchString => dispatch(findStudents(searchString)),
  getStudent: studentNumber => dispatch(getStudent(studentNumber)),
})

export const ConnectedStudentSearch = connect(mapStateToProps, mapDispatchToProps)(Timeout(StudentSearch))
