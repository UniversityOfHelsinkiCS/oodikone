import moment from 'moment'
import React, { useEffect, useState } from 'react'
import Datetime from 'react-datetime'
import { Modal, Form, Button, TextArea } from 'semantic-ui-react'
import qs from 'query-string'
import SearchHistory from 'components/SearchHistory'
import {
  useCreateOpenUniCourseSearchMutation,
  useDeleteOpenUniCourseSearchMutation,
  useUpdateOpenUniCourseSearchMutation,
} from 'redux/openUniPopulations'

const CustomOpenUniSearch = ({ setValues, savedSearches, location, history }) => {
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

  const parseQueryFromUrl = () => {
    const { courseList, startdate, enddate } = qs.parse(location.search)
    let courseCodes = courseList
    if (!Array.isArray(courseList)) courseCodes = [courseList]
    const query = {
      courseList: courseCodes,
      startdate,
      enddate,
    }
    return query
  }

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

  useEffect(() => {
    if (location.search) {
      const query = parseQueryFromUrl()
      setValues(query)
    }
  }, [location.search])

  const pushQueryToUrl = query => {
    setImmediate(() => {
      const searchString = qs.stringify(query)
      history.push({ search: searchString })
    })
  }

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

  const onClicker = e => {
    e.preventDefault()
    const courseList = input
      .split(',')
      .map(code => code.trim().toUpperCase())
      .filter(code => code.length > 0)
    const query = {
      courseList,
      startdate: moment(startdate).toISOString(),
      enddate: moment(enddate).toISOString(),
    }
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
    const courseList = input
      .split(',')
      .map(code => code.trim().toUpperCase())
      .filter(code => code.length > 0)
    if (selectedSearchId !== '') {
      updateOpenUniCourseSearch({ id: selectedSearchId, courseList })
    } else {
      createOpenUniCourseSearch({ courseList, name })
    }
  }
  return (
    <Modal
      trigger={
        <Button size="small" color="blue" onClick={() => setModal(true)} data-cy="custom-pop-search-button">
          Fetch Open Uni Students
        </Button>
      }
      open={modal}
      onClose={handleClose}
      size="small"
    >
      <Modal.Content>
        <Form>
          <h2> Fetch open uni course population</h2>
          <Form.Field>
            <Form.Field>
              <em> Insert name for this population if you wish to save it </em>
              <Form.Input
                disabled={selectedSearchId !== ''}
                value={name}
                placeholder="name"
                onChange={e => setName(e.target.value)}
              />
            </Form.Field>
            <em>Insert course code(s)</em>
            <TextArea
              value={input}
              placeholder="TKT12345, PSYK-123"
              onChange={e => setInput(e.target.value)}
              data-cy="s-no-input"
            />
          </Form.Field>
          <SearchHistory
            header="Saved populations"
            items={searchList?.map(s => ({
              ...s,
              text: s.name,
              timestamp: s.updatedAt,
              params: { id: s.id },
            }))}
            updateItem={() => null}
            handleSearch={onSelectSearch}
          />
          <Form.Field>
            <em>Select beginning</em>
            <Datetime
              value={startdate}
              onChange={value => setStartdate(value)}
              timeFormat={false}
              locale="fi"
              isValidDate={date => date.isBefore(enddate)}
              closeOnSelect
            />
          </Form.Field>
          <Form.Field>
            <em>Select ending for enrollments:</em>
            <br />
            <em>Attainments are fetched until today.</em>
            <Datetime
              value={enddate}
              onChange={value => setEnddate(value)}
              timeFormat={false}
              locale="fi"
              isValidDate={date => date.isAfter(startdate)}
              closeOnSelect
            />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button
          disabled={!name || updateIsLoading || createIsLoading}
          loading={updateIsLoading || createIsLoading}
          floated="left"
          icon="save"
          onClick={onSave}
          content="Save"
        />
        <Button
          disabled={!selectedSearchId || deleteIsLoading}
          negative
          floated="left"
          icon="trash"
          onClick={onDelete}
          content="Delete"
        />
        <Button onClick={handleClose}>Cancel</Button>
        <Button positive onClick={e => onClicker(e)} data-cy="search-button">
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

export default CustomOpenUniSearch
