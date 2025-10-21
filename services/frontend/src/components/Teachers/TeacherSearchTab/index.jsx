import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { debounce } from 'lodash'
import { useState, useCallback } from 'react'
import { Icon, Search, Segment } from 'semantic-ui-react'

import { splitByEmptySpace, validateInputLength } from '@/common'
import { Link } from '@/components/material/Link'
import { SortableTable } from '@/components/SortableTable'
import { useFindTeachersQuery } from '@/redux/teachers'
import './teacherSearch.css'

export const TeacherSearchTab = () => {
  const [searchString, setSearchString] = useState('')
  const [query, setQuery] = useState('')
  const {
    data: teachers = [],
    isLoading,
    isUninitialized,
  } = useFindTeachersQuery(
    { searchString: splitByEmptySpace(query.trim()).find(text => validateInputLength(text, 4)) },
    { skip: !splitByEmptySpace(query.trim()).find(text => validateInputLength(text, 4)) }
  )

  const debouncedSetQuery = useCallback(
    debounce(value => {
      setQuery(value)
    }, 500),
    []
  )

  const handleSearchChange = event => {
    debouncedSetQuery(event.target.value)
    setSearchString(event.target.value)
  }

  const columns = [
    {
      key: 'name',
      title: 'Name',
      getRowVal: s => s.name,
      getRowContent: row => (
        <Link target="_blank" to={`/teachers/${row.id}`}>
          {row.name}
        </Link>
      ),
    },
  ]

  const getContent = () => {
    if (isUninitialized) return null

    if (isLoading || query !== searchString) return <Icon loading name="spinner" size="huge" />

    if (teachers.length === 0) return <div>No teachers matched your search</div>

    return <SortableTable columns={columns} data={teachers} defaultSort={['name', 'asc']} hideHeaderBar />
  }

  return (
    <>
      <Alert icon={false} severity="info" variant="outlined">
        <Typography variant="h6">Teacher search</Typography>
        Search for a teacher and click the search result to view their individual statistics from their entire career.
      </Alert>
      <div className="searchContainer">
        <Search
          className="searchInput"
          input={{ fluid: true }}
          onSearchChange={handleSearchChange}
          placeholder="Search by entering a name or an id"
          showNoResults={false}
          value={searchString}
        />
        <Segment className="contentSegment">{getContent()}</Segment>
      </div>
    </>
  )
}
