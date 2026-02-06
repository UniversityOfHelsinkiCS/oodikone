import Button from '@mui/material/Button'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useState, Fragment } from 'react'

import { DegreeCoursesTab } from '@/pages/StudyProgramme/DegreeCoursesTab'
import { VisibilityIcon } from '@/theme'

export const FilterDegreeCoursesModal = ({ degreeProgramme, years }) => {
  const [open, setOpen] = useState(false)

  const setModalOpenState = state => {
    setOpen(state)
  }

  return (
    <Fragment>
      <Button onClick={() => setModalOpenState(true)} startIcon={<VisibilityIcon />} variant="outlined">
        Manage Courses Shown
      </Button>
      <Dialog className="MyDialogThings" maxWidth="md" onClose={() => setModalOpenState(false)} open={open}>
        <DialogTitle>Hide degree courses</DialogTitle>
        <DialogContent className="MyDialogContent">
          <DegreeCoursesTab degreeProgramme={degreeProgramme} years={years} />

          <Button
            color="primary"
            onClick={() => setModalOpenState(false)}
            style={{ marginTop: '10px' }}
            variant="contained"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}
