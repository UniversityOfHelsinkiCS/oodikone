import EyeIcon from '@mui/icons-material/RemoveRedEye'
import SaveIcon from '@mui/icons-material/Save'
import Button from '@mui/material/Button'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useState, Fragment } from 'react'

import { DegreeCoursesTab } from '@/pages/StudyProgramme/DegreeCoursesTab'

export const FilterDegreeCoursesModal = ({ degreeProgramme, years }) => {
  const [open, setOpen] = useState(false)

  const setModalOpenState = state => {
    setOpen(state)
  }

  return (
    <Fragment>
      <Button onClick={() => setModalOpenState(true)} startIcon={<EyeIcon />} variant="outlined">
        Manage Courses Shown
      </Button>
      <Dialog className="MyDialogThings" maxWidth="md" open={open}>
        <DialogTitle>Hide degree courses</DialogTitle>
        <DialogContent className="MyDialogContent">
          <DegreeCoursesTab degreeProgramme={degreeProgramme} years={years} />

          <Button
            color="success"
            onClick={() => setModalOpenState(false)}
            startIcon={<SaveIcon />}
            style={{ marginTop: '10px' }}
            variant="contained"
          >
            Save & Close
          </Button>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}
