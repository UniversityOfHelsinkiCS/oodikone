import SearchIcon from '@mui/icons-material/Search'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'

import { debounce } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { StyledTable } from '@/components/material/StyledTable'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useSearchStudentsQuery } from '@/redux/students'
import { ActiveStudyRight } from '@/types/api/students'
import { reformatDate } from '@/util/timeAndDate'

const getProgrammes = (studyRights: ActiveStudyRight[], getTextIn) =>
  [
    ...new Set(
      studyRights
        .reduce(
          (res, studyRight) => [...res, ...studyRight.studyRightElements.map(element => getTextIn(element.name))],
          [] as string[]
        )
        .sort()
    ),
  ] as string[]

export const StudentSearch = () => {
  const { getTextIn } = useLanguage()
  const [searchString, setSearchString] = useState('')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { visible: showNames } = useStudentNameVisibility()
  const { data: students, isFetching } = useSearchStudentsQuery(
    { searchTerm: query },
    {
      skip: query.trim().length < (Number.isNaN(Number(query)) ? 4 : 6),
    }
  )
  const debouncedSetQuery = useMemo(() => debounce(setQuery, 1000), [setQuery])
  const isLoading = isFetching || query !== searchString

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetQuery(event.target.value)
    setSearchString(event.target.value)
  }

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel()
    }
  }, [debouncedSetQuery])

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <TextField
        autoFocus
        data-cy="student-search"
        fullWidth
        onChange={handleSearchChange}
        placeholder="Search by student number or student name"
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { borderRadius: 3 },
          },
        }}
        value={searchString}
      />
      {!isLoading && students && students.length > 0 && searchString && (
        <StyledTable>
          <TableHead>
            <TableRow>
              {showNames && (
                <>
                  <TableCell>Last name</TableCell>
                  <TableCell>First names</TableCell>
                </>
              )}
              <TableCell>Student number</TableCell>
              <TableCell>Started</TableCell>
              <TableCell align="right">Credits</TableCell>
              <TableCell>Active study rights</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map(student => (
              <TableRow
                key={student.studentNumber}
                onClick={() => navigate(`/students/${student.studentNumber}`)}
                sx={{ cursor: 'pointer' }}
              >
                {showNames && (
                  <>
                    <TableCell>{student.lastName}</TableCell>
                    <TableCell>{student.firstNames}</TableCell>
                  </>
                )}
                <TableCell>{student.studentNumber}</TableCell>
                <TableCell>
                  {student.started ? reformatDate(student.started, DISPLAY_DATE_FORMAT) : 'Unavailable'}
                </TableCell>
                <TableCell align="right">{student.credits}</TableCell>
                <TableCell>
                  {getProgrammes(student.activeStudyRights, getTextIn).map(programme => (
                    <div key={`${programme}`}>{programme}</div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      )}
      {[1, 2, 3].includes(searchString.length) && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Alert severity="info">Search term is not accurate enough</Alert>
        </Box>
      )}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {!isLoading && students?.length === 0 && searchString.length > 3 && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Alert severity="error">No students found</Alert>
        </Box>
      )}
    </Stack>
  )
}
