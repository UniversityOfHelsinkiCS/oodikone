import EyeIcon from '@mui/icons-material/RemoveRedEye'
import SaveIcon from '@mui/icons-material/Save'
import Button from '@mui/material/Button'
import { useState } from 'react'
import { Modal, Container } from 'semantic-ui-react'

import { DegreeCoursesTab } from '@/pages/StudyProgramme/DegreeCoursesTab'

export const FilterDegreeCoursesModal = ({ degreeProgramme, years }) => {
  const [open, setOpen] = useState(false)

  const setModalOpenState = state => {
    setOpen(state)
  }

  return (
    <Modal
      onOpen={() => setModalOpenState(true)}
      open={open}
      size="large"
      trigger={
        <Button startIcon={<EyeIcon />} variant="outlined">
          Manage Courses Shown
        </Button>
      }
    >
      <Modal.Header>Hide degree courses</Modal.Header>
      <Modal.Content image>
        <Container>
          <DegreeCoursesTab degreeProgramme={degreeProgramme} years={years} />

          <Button
            onClick={() => setModalOpenState(false)}
            startIcon={<SaveIcon />}
            style={{ marginTop: '10px' }}
            variant="contained"
          >
            Save & Close
          </Button>
        </Container>
      </Modal.Content>
    </Modal>
  )
}
