import React, { useState } from 'react'
import { Button, Icon, Modal, Container } from 'semantic-ui-react'

import { DegreeCoursesTable } from '../StudyProgramme/DegreeCourses'

export const FilterDegreeCoursesModal = ({ studyProgramme, year }) => {
  const [open, setOpen] = useState(false)

  const setModalOpenState = state => {
    setOpen(state)
  }

  return (
    <Modal
      size="large"
      onOpen={() => setModalOpenState(true)}
      open={open}
      trigger={
        <span style={{ margin: '0 0.5rem' }}>
          <Button basic icon labelPosition="left">
            <Icon name="eye" />
            Manage Courses Shown
          </Button>
        </span>
      }
    >
      <Modal.Header>Hide degree courses</Modal.Header>
      <Modal.Content image>
        <Container>
          <DegreeCoursesTable year={year} studyProgramme={studyProgramme} />
          <Button onClick={() => setModalOpenState(false)} icon labelPosition="left" style={{ marginTop: '10px' }}>
            <Icon name="save" />
            Save & Close
          </Button>
        </Container>
      </Modal.Content>
    </Modal>
  )
}
