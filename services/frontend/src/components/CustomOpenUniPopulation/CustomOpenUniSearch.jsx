import moment from 'moment'
import qs from 'query-string'
import React, { useEffect, useState } from 'react'
import Datetime from 'react-datetime'
import { useLocation, useHistory } from 'react-router-dom'
import { Modal, Form, Button, TextArea } from 'semantic-ui-react'

import { SearchHistory } from '@/components/SearchHistory'
import {
  useCreateOpenUniCourseSearchMutation,
  useDeleteOpenUniCourseSearchMutation,
  useUpdateOpenUniCourseSearchMutation,
} from '@/redux/openUniPopulations'

export const CustomOpenUniSearch = ({ setValues, savedSearches }) => {
  const location = useLocation()
  const history = useHistory()
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')
  const [searchList, setSearches] = useState(savedSearches)
  const [name, setName] = useState('')
  const [startdate, setStartdate] = useState(moment('01-08-2017 00:00:00', 'DD-MM-YYYY'))
  const [enddate, setEnddate] = useState(moment().endOf('day'))
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
      const filteredsearches = searchList.filter(s => s.id !== deletedData)
      setSearches(filteredsearches)
    }
  }, [deletedData])

  const pushQueryToUrl = query => {
    setTimeout(() => {
      const searchString = qs.stringify(query)
      history.push({ search: searchString })
    }, 0)
  }

  const parseQueryFromUrl = () => {
    const { courseCode, startdate, enddate } = qs.parse(location.search)
    let courseCodes = courseCode
    if (!Array.isArray(courseCode)) courseCodes = [courseCode]
    const query = {
      courseList: courseCodes,
      startdate: moment(startdate, 'DD-MM-YYYY').toISOString(),
      enddate: moment(enddate, 'DD-MM-YYYY').endOf('day').toISOString(),
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
    setStartdate(moment('01-08-2017 00-00-00', 'DD-MM-YYYY'))
    setEnddate(moment().endOf('day'))
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
      startdate: moment(startdate).isValid()
        ? moment(startdate).format('DD-MM-YYYY')
        : moment('01-08-2017', 'DD-MM-YYYY').format('DD-MM-YYYY'),
      enddate: moment(enddate).isValid() ? moment(enddate).format('DD-MM-YYYY') : moment().format('DD-MM-YYYY'),
    }

    setValues({
      courseList,
      startdate: moment(startdate).isValid()
        ? moment(startdate).toISOString()
        : moment('01-08-2017', 'DD-MM-YYYY').toISOString(),
      enddate: moment(enddate).isValid() ? moment(enddate).toISOString() : moment().toISOString(),
    })
    pushQueryToUrl(query)
    handleClose()
  }

  const onDelete = () => {
    deleteOpenUniCourseSearch({ id: selectedSearchId })
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
      updateOpenUniCourseSearch({ id: selectedSearchId, courseList })
    } else {
      createOpenUniCourseSearch({ courseList, name })
    }
  }
  return (
    <Modal
      onClose={handleClose}
      open={modal}
      size="small"
      trigger={
        <Button color="blue" data-cy="open-uni-search-button" onClick={() => setModal(true)} size="small">
          Fetch Open Uni Students
        </Button>
      }
    >
      <Modal.Content>
        <Form>
          <h2> Fetch open uni course population</h2>
          <Form.Field>
            <Form.Field data-cy="search-name">
              <em> Insert name for this population if you wish to save it </em>
              <Form.Input
                disabled={selectedSearchId !== ''}
                onChange={event => setName(event.target.value)}
                placeholder="name"
                value={name}
              />
            </Form.Field>
            <em>Insert course code(s)</em>
            <TextArea onChange={event => setInput(event.target.value)} placeholder="TKT12345, PSYK-123" value={input} />
          </Form.Field>
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
          <Form.Field data-cy="begin-of-search">
            <em>Select beginning</em>
            <Datetime
              closeOnSelect
              isValidDate={date => date.isBefore(enddate)}
              locale="fi"
              onChange={value => setStartdate(value)}
              timeFormat={false}
              value={startdate}
            />
          </Form.Field>
          <Form.Field data-cy="end-of-search">
            <em>Select ending for enrollments:</em>
            <br />
            <em>Attainments are fetched until today.</em>
            <Datetime
              closeOnSelect
              isValidDate={date => date.isAfter(startdate)}
              locale="fi"
              onChange={value => setEnddate(value)}
              timeFormat={false}
              value={enddate}
            />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button
          content="Save"
          data-cy="save-search"
          disabled={!name || updateIsLoading || createIsLoading}
          floated="left"
          icon="save"
          loading={updateIsLoading || createIsLoading}
          onClick={onSave}
        />
        <Button
          content="Delete"
          disabled={!selectedSearchId || deleteIsLoading}
          floated="left"
          icon="trash"
          negative
          onClick={onDelete}
        />
        <Button onClick={handleClose}>Cancel</Button>
        <Button data-cy="search-button" onClick={event => onClicker(event)} positive>
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )
}
