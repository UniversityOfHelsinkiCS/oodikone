import IconButton from '@mui/material/IconButton'

import { useAddStudyProgrammePinMutation, useRemoveStudyProgrammePinMutation } from '@/redux/studyProgrammePins'
import { PushPinIcon } from '@/theme'
import { type PopulationSearchProgramme } from '@/types/populationSearch'

export const ToggleablePin = ({ programme }: { programme: PopulationSearchProgramme }) => {
  const [addPin] = useAddStudyProgrammePinMutation()
  const [removePin] = useRemoveStudyProgrammePinMutation()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (programme.pinned) {
      void removePin({ programmeCode: programme.code })
    } else {
      void addPin({ programmeCode: programme.code })
    }
  }

  return (
    <IconButton onClick={handleClick} onMouseDown={event => event.preventDefault()} sx={{ m: 0, p: 0 }}>
      <PushPinIcon sx={{ color: programme.pinned ? 'text.primary' : 'text.disabled' }} />
    </IconButton>
  )
}
