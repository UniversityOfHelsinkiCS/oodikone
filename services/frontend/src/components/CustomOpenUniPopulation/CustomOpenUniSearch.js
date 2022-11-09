import moment from 'moment'
import React, { useState } from 'react'
import Datetime from 'react-datetime'
import { Modal, Form, Button, TextArea } from 'semantic-ui-react'

const CustomOpenUniSearch = ({ setValues }) => {
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')
  const [startdate, setStartdate] = useState(moment('01-08-2017 00:00:00', 'DD-MM-YYYY'))
  const [enddate, setEnddate] = useState(moment().endOf('day'))

  const clearForm = () => {
    setInput('')
    setStartdate(moment('01-08-2017 00-00-00', 'DD-MM-YYYY'))
    setEnddate(moment().endOf('day'))
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
    setValues({ courseList, startdate, enddate })
    handleClose()
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
            <em>Insert course code(s)</em>
            <TextArea
              value={input}
              placeholder="TKT12345, PSYK-123"
              onChange={e => setInput(e.target.value)}
              data-cy="s-no-input"
            />
          </Form.Field>
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
            <em>Select ending:</em>
            <br />
            <em>Enrollments are fetched until selected day.</em>
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
        <Button onClick={handleClose}>Cancel</Button>
        <Button positive onClick={e => onClicker(e)} data-cy="search-button">
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

export default CustomOpenUniSearch
