import Button from '@mui/material/Button'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useState } from 'react'

import { DegreeSettingsTab, DegreeCoursesTab } from '@/pages/StudyProgramme/DegreeCoursesTab'
import { VisibilityIcon } from '@/theme'

const defaultText = 'Manage course visibility'
const defaultIcon = <VisibilityIcon />

export const FilterDegreeCoursesModal = ({
  degreeProgramme,
  initialTab,
  text,
  icon,
}: {
  degreeProgramme: string
  initialTab: DegreeSettingsTab
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
          <DegreeCoursesTab degreeProgramme={degreeProgramme} initialTab={initialTab} />
          <Button color="primary" onClick={() => setModalOpen(false)} style={{ marginTop: '10px' }} variant="contained">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
