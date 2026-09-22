import Button from '@mui/material/Button'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useState } from 'react'

import { DegreeCoursesTab } from '@/pages/StudyProgramme/DegreeCoursesTab'
import { VisibilityIcon } from '@/theme'
import { ManageCoursesShownInfo } from '@/pages/StudyProgramme/DegreeCoursesTab/InfoBox'

const defaultText = 'Manage course visibility'
const defaultIcon = <VisibilityIcon />

export const FilterDegreeCoursesModal = ({
  degreeProgramme,
  text,
  icon,
}: {
  degreeProgramme: string
  text?: string
  icon?: React.ReactNode
}) => {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setModalOpen(true)} startIcon={icon ?? defaultIcon} variant="outlined">
        {text ?? defaultText}
      </Button>
      <Dialog maxWidth="md" onClose={() => setModalOpen(false)} open={modalOpen}>
        <DialogTitle>Degree programme settings</DialogTitle>
        <DialogContent>
          <ManageCoursesShownInfo />
          <DegreeCoursesTab combinedProgramme="" degreeProgramme={degreeProgramme} />
          <Button color="primary" onClick={() => setModalOpen(false)} style={{ marginTop: '10px' }} variant="contained">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
