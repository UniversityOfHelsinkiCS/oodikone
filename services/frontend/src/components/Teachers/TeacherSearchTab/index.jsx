import SearchIcon from '@mui/icons-material/Search'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { debounce } from 'lodash'
import { useState, useCallback } from 'react'

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

    if (isLoading || query !== searchString) return <CircularProgress />

    if (!teachers.length) return <div>No teachers matched your search</div>

    return <SortableTable columns={columns} data={teachers} defaultSort={['name', 'asc']} hideHeaderBar />
  }

  return (
    <>
      <Alert icon={false} severity="info" variant="outlined">
        <Typography variant="h6">Teacher search</Typography>
        Search for a teacher and click the search result to view their individual statistics from their entire career.
      </Alert>
      <Box className="searchContainer" sx={{ padding: 2, gap: 2 }}>
        <TextField
          className="searchInput"
          data-cy="teacher-search"
          onChange={handleSearchChange}
          placeholder="Search by entering a name or an id"
          slotProps={{
            input: { endAdornment: <SearchIcon /> },
          }}
          value={searchString}
        />
        <Paper className="contentSegment">{getContent()}</Paper>
      </Box>
    </>
  )
}
