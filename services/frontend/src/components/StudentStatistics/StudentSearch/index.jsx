import { debounce } from 'lodash'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Search, Segment } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { SortableTable } from '@/components/SortableTable'
import { useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useSearchStudentsQuery } from '@/redux/students'
import { reformatDate } from '@/util/timeAndDate'

const getProgrammes = (studyRights, getTextIn) =>
  studyRights
    .reduce((res, studyRight) => [...res, ...studyRight.studyRightElements.map(element => getTextIn(element.name))], [])
    .sort()

const StudentPageLink = ({ studentNumber, text }) => (
  <Link style={{ color: 'black' }} to={`/students/${studentNumber}`}>
    {text}
  </Link>
)

export const StudentSearch = () => {
  const { getTextIn } = useLanguage()
  const [searchString, setSearchString] = useState('')
  const [query, setQuery] = useState('')
  const { visible: showNames } = useStudentNameVisibility()
  const { data: students = [], isLoading } = useSearchStudentsQuery(query, {
    skip: query.trim().length < 4 || (Number(query) && query.trim().length < 6),
  })
  const debouncedSetQuery = useCallback(
    debounce(value => {
      setQuery(value)
    }, 1000),
    []
  )

  const handleSearchChange = (_event, { value }) => {
    debouncedSetQuery(value)
    setSearchString(value)
  }

  const renderSearchResults = () => {
    if (isLoading) return <div style={{ margin: 100 }} />

    const formatStudents = students =>
      students.map(({ studentNumber, credits, started, lastname, firstnames, studyRights }) => ({
        studentNumber,
        started,
        credits,
        lastname,
        firstnames,
        studyRights,
      }))

    const displayedStudents = formatStudents(students)

    if (query.length === 0) return null

    if (displayedStudents.length === 0) return <div>No search results or search term is not accurate enough</div>

    const studentsSorted = displayedStudents
      .sort((a, b) => {
        if (a.started && !b.started) return -1
        if (!a.started && b.started) return 1
        if (a.started && b.started) return new Date(a.started) > new Date(b.started) ? -1 : 1
        const lastnameComparison = a.lastname.localeCompare(b.lastname)
        if (lastnameComparison !== 0) return lastnameComparison
        return a.firstnames.localeCompare(b.firstnames)
      })
      .slice(0, 200)

    const columns = [
      {
        key: 'studentnumber',
        title: 'Student number',
        getRowVal: student => student.studentNumber,
        getRowContent: student => (
          <StudentPageLink studentNumber={student.studentNumber} text={student.studentNumber} />
        ),
      },
      {
        key: 'started',
        title: 'Started',
        filterType: 'date',
        getRowVal: student => (student.started ? new Date(student.started) : 'Unavailable'),
        getRowContent: student => (
          <StudentPageLink
            studentNumber={student.studentNumber}
            text={student.started ? reformatDate(new Date(student.started), DISPLAY_DATE_FORMAT) : 'Unavailable'}
          />
        ),
      },
      {
        key: 'credits',
        title: 'Credits',
        getRowVal: student => student.credits,
        getRowContent: student => <StudentPageLink studentNumber={student.studentNumber} text={student.credits} />,
      },
      {
        key: 'studyrights',
        title: 'Active studyrights',
        sortable: false,
        filterType: 'multi',
        getRowVal: student => getProgrammes(student.studyRights, getTextIn),
        formatValue: programmes => programmes.map(programme => <div key={`${programme}`}>{programme}</div>),
      },
    ]

    if (showNames) {
      const nameColumns = [
        {
          key: 'lastname',
          title: 'Last names',
          getRowVal: student => student.lastname,
          getRowContent: student => <StudentPageLink studentNumber={student.studentNumber} text={student.lastname} />,
        },
        {
          key: 'firstnames',
          title: 'Given names',
          getRowVal: student => student.firstnames,
          getRowContent: student => <StudentPageLink studentNumber={student.studentNumber} text={student.firstnames} />,
        },
      ]
      columns.splice(0, 0, ...nameColumns)
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <p>
          {displayedStudents.length > 200 &&
            `Your search returned ${displayedStudents.length} results. Only the first 200 are shown.`}
        </p>
        <SortableTable columns={columns} data={studentsSorted} hideHeaderBar />
      </div>
    )
  }

  return (
    <>
      <Container>
        <Search
          input={{ fluid: true }}
          loading={isLoading}
          onSearchChange={handleSearchChange}
          placeholder="Search with a student number or name (surname firstname)"
          showNoResults={false}
          value={searchString}
        />
      </Container>
      <Segment basic>
        <SegmentDimmer isLoading={isLoading} />
        {renderSearchResults()}
      </Segment>
    </>
  )
}
