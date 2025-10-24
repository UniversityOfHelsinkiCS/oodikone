import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { DateRangeSelector } from '@/components/common/DateRangeSelector'
import { SearchHistory } from '@/components/material/SearchHistory'
import {
  useCreateOpenUniCourseSearchMutation,
  useDeleteOpenUniCourseSearchMutation,
  useUpdateOpenUniCourseSearchMutation,
} from '@/redux/openUniPopulations'
import { parseQueryParams, queryParamsToString } from '@/util/queryparams'
import { formatISODate } from '@/util/timeAndDate'
import { formatToArray } from '@oodikone/shared/util'

export const CustomOpenUniSearch = ({ setValues, savedSearches }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')
  const [searchList, setSearches] = useState(savedSearches)
  const [name, setName] = useState('')
  const [startdate, setStartdate] = useState(dayjs('01-08-2017 00:00:00', 'DD-MM-YYYY'))
  const [enddate, setEnddate] = useState(dayjs().endOf('day'))
  const [selectedSearchId, setSelectedSearchId] = useState('')
  const [updateOpenUniCourseSearch, { isLoading: updateIsLoading, data: updatedData }] =
    useUpdateOpenUniCourseSearchMutation()
  const [createOpenUniCourseSearch, { isLoading: createIsLoading, data: createdData }] =
    useCreateOpenUniCourseSearchMutation()
  const [deleteOpenUniCourseSearch, { isLoading: deleteIsLoading, data: deletedData }] =
    useDeleteOpenUniCourseSearchMutation()

  useEffect(() => {
    if (updatedData) {
      const updatedSearches = searchList.map(s => (s.id === updatedData.id ? updatedData : s))
      setSearches(updatedSearches)
    }
  }, [updatedData])

  useEffect(() => {
    if (createdData && !createdData.error) {
      const newList = searchList.concat(createdData)
      setSearches(newList)
    }
  }, [createdData])

  useEffect(() => {
    if (deletedData) {
      const filteredSearches = searchList.filter(s => s.id !== deletedData)
      setSearches(filteredSearches)
    }
  }, [deletedData])

  const pushQueryToUrl = query => {
    setTimeout(() => {
      const searchString = queryParamsToString(query)
      void navigate({ search: searchString }, { replace: true })
    }, 0)
  }

  const parseQueryFromUrl = () => {
    const { courseCode, startdate, enddate } = parseQueryParams(location.search)
    const courseCodes = formatToArray(courseCode)
    const query = {
      courseList: courseCodes,
      startdate: dayjs(startdate, 'DD-MM-YYYY').toISOString(),
      enddate: dayjs(enddate, 'DD-MM-YYYY').endOf('day').toISOString(),
    }
    return query
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!location.search) {
        setValues({})
      } else {
        const query = parseQueryFromUrl()
        setValues(query)
      }
    }, 0)

    // Cleanup function to clear the timeout
    return () => clearTimeout(timer)
  }, [location.search])

  const clearForm = () => {
    setInput('')
    setName('')
    setStartdate(dayjs('01-08-2017 00-00-00', 'DD-MM-YYYY'))
    setEnddate(dayjs().endOf('day'))
    setSelectedSearchId('')
  }

  const handleClose = () => {
    setModal(false)
    clearForm()
  }

  const onClicker = event => {
    event.preventDefault()
    const courseList = input.split(/[\s,]+/).map(code => code.trim().toUpperCase())
    const query = {
      courseCode: courseList,
      startdate: dayjs(startdate).isValid() ? formatISODate(startdate) : formatISODate(new Date('01-08-2017')),
      enddate: dayjs(enddate).isValid() ? formatISODate(enddate) : formatISODate(new Date()),
    }

    setValues({
      courseList,
      startdate: dayjs(startdate).isValid()
        ? dayjs(startdate).toISOString()
        : dayjs('01-08-2017', 'DD-MM-YYYY').toISOString(),
      enddate: dayjs(enddate).isValid() ? dayjs(enddate).toISOString() : dayjs().toISOString(),
    })
    pushQueryToUrl(query)
    handleClose()
  }

  const onDelete = () => {
    void deleteOpenUniCourseSearch({ id: selectedSearchId })
    clearForm()
  }

  const onSelectSearch = selectedId => {
    if (!selectedId) {
      clearForm()
      return
    }
    const { id: selectedSearchId } = selectedId
    const selectedSearch = searchList.find(search => search.id === selectedSearchId)
    if (selectedSearch) {
      setInput(selectedSearch.courseList.join(', '))
      setName(selectedSearch.name)
      setSelectedSearchId(selectedSearch.id)
    }
  }

  const onSave = () => {
    const courseList = input.split(/[\s,]+/).map(code => code.trim().toUpperCase())
    if (selectedSearchId !== '') {
      void updateOpenUniCourseSearch({ id: selectedSearchId, courseList })
    } else {
      void createOpenUniCourseSearch({ courseList, name })
    }
  }
  return (
    <>
      <Button color="primary" data-cy="open-uni-search-button" onClick={() => setModal(true)} variant="outlined">
        Fetch Open Uni Students
      </Button>
      <Dialog fullWidth onClose={handleClose} open={modal}>
        <Paper sx={{ padding: 2 }}>
          <h2>Fetch open uni course population</h2>

          <Stack>
            <em>Insert name for this population if you wish to save it:</em>
            <TextField
              data-cy="search-name"
              disabled={selectedSearchId !== ''}
              onChange={event => setName(event.target.value)}
              placeholder="name"
              value={name}
            />
          </Stack>

          <Stack>
            <em>Insert course code(s):</em>
            <TextField
              minRows={2}
              multiline
              onChange={event => setInput(event.target.value)}
              placeholder="TKT12345, PSYK-123"
              value={input}
            />
          </Stack>

          <SearchHistory
            handleSearch={onSelectSearch}
            header="Saved populations"
            items={searchList?.map(s => ({
              ...s,
              text: s.name,
              timestamp: new Date(s.updatedAt),
              params: { id: s.id },
            }))}
            updateItem={() => null}
          />

          <Typography>Select beginnings and ending dates for enrollemnts:</Typography>
          <DateRangeSelector
            onChange={([startDate, endDate]) => {
              setStartdate(startDate)
              setEnddate(endDate)
            }}
            value={[startdate, enddate]}
          />
          <Box sx={{ py: 2 }}>
            <Stack flexDirection="row" sx={{ justifyContent: 'space-between' }}>
              <Box>
                <Button
                  color="primary"
                  data-cy="save-search"
                  disabled={!name || updateIsLoading || createIsLoading}
                  loading={updateIsLoading || createIsLoading}
                  onClick={onSave}
                  variant="outlined"
                >
                  Save
                </Button>
                <Button
                  color="error"
                  disabled={!selectedSearchId || deleteIsLoading}
                  onClick={onDelete}
                  sx={{ ml: 0.5 }}
                  variant="outlined"
                >
                  Delete
                </Button>
              </Box>
              <Box>
                <Button color="error" onClick={handleClose} variant="outlined">
                  Cancel
                </Button>
                <Button
                  color="primary"
                  data-cy="search-button"
                  onClick={event => onClicker(event)}
                  sx={{ ml: 0.5 }}
                  variant="outlined"
                >
                  Search population
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Dialog>
    </>
  )
}
