import SearchIcon from '@mui/icons-material/Search'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'

import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { debounce } from 'lodash-es'
import { useState, useCallback } from 'react'

import { validateInputLength } from '@/common'
import { Link } from '@/components/common/Link'
import { StyledTable } from '@/components/common/StyledTable'
import { useFindTeachersQuery } from '@/redux/teachers'
import { splitByEmptySpace } from '@oodikone/shared/util'

export const TeacherSearchTab = () => {
  const [searchString, setSearchString] = useState('')
  const [query, setQuery] = useState('')

  const trimmedQuery = query.trim()
  const searchTermIsInvalid =
    !validateInputLength(trimmedQuery, 4) && !splitByEmptySpace(trimmedQuery).find(searchTerm => searchTerm.length >= 4)

  const {
    data: teachers = [],
    isLoading,
    isUninitialized,
  } = useFindTeachersQuery({ searchString: trimmedQuery }, { skip: searchTermIsInvalid })

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

  const getContent = () => {
    if (isUninitialized) return null

    if (isLoading || query !== searchString) return <CircularProgress />

    if (!teachers.length) return <div>No teachers matched your search</div>

    return (
      <StyledTable>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teachers.map(({ id, name }) => (
            <TableRow key={id}>
              <TableCell>
                <Link target="_blank" to={`/teachers/${id}`}>
                  {name}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    )
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
          sx={{ width: '100%', maxWidth: '600px', py: '1rem' }}
          value={searchString}
        />
        <Paper sx={{ maxWidth: 'sm' }}>{getContent()}</Paper>
      </Box>
    </>
  )
}
