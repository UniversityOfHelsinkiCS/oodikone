import React, { useState } from 'react'
import DegreeCoursesTable from '../StudyProgramme/DegreeCourses'
import { Button, Icon, Modal } from 'semantic-ui-react'
import { string } from 'prop-types'

const FilterDegreeCoursesModal = ({ studyProgramme }) => {
  const [open, setOpen] = useState(false)

  return (
    <Modal
      size="large"
      onOpen={() => setOpen(true)}
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
        <Modal.Description>
          <DegreeCoursesTable studyProgramme={studyProgramme} />
          <Button onClick={() => setOpen(false)} icon labelPosition="left">
            <Icon name="save" />
            Save & Close
          </Button>
        </Modal.Description>
      </Modal.Content>
    </Modal>
  )
}

FilterDegreeCoursesModal.propTypes = {
  studyProgramme: string.isRequired
}

export default FilterDegreeCoursesModal
