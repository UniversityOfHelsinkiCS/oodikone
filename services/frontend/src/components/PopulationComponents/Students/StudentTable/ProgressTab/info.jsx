import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'

import { CheckIcon, CloseIcon, RemoveIcon, SwapHorizIcon } from '@/theme'

export const TableInfo = () => (
  <Alert severity="primary" sx={{ my: 2 }} variant="outlined">
    <Typography variant="h6">Criteria:</Typography>
    <Typography sx={{ display: 'flex' }}>
      <CheckIcon color="success" />: Student has passed the course in the academic year.
    </Typography>
    <Typography sx={{ display: 'flex' }}>
      <CheckIcon color="disabled" />: Student has passed the course outside of the corresponding academic year.
    </Typography>
    <Typography sx={{ display: 'flex' }}>
      <SwapHorizIcon color="success" />: Student has credit transfer for the course.
    </Typography>
    <Typography sx={{ display: 'flex' }}>
      <CloseIcon color="error" />: Student has failed the course.
    </Typography>
    <Typography sx={{ display: 'flex' }}>
      <RemoveIcon color="disabled" />: Student has enrolled, but has not received any grade from the course.
    </Typography>

    <Typography variant="h6">Semester enrollments:</Typography>
    <Typography sx={{ display: 'flex' }}>
      <span className="enrollment-label label-present" style={{ margin: 'auto 0' }} />: Student has an active semester
      enrollment.
    </Typography>
    <Typography sx={{ display: 'flex' }}>
      <span className="enrollment-label label-absent" style={{ margin: 'auto 0' }} />: Student has enrolled as absent.
    </Typography>
    <Typography sx={{ display: 'flex' }}>
      <span className="enrollment-label label-passive" style={{ margin: 'auto 0' }} />: Passive: Student did not enroll
      at all.
    </Typography>
    <Typography sx={{ display: 'flex' }}>
      <span className="enrollment-label label-none" style={{ margin: 'auto 0' }} />
      : Student has no enrollment, but also no study right for the semester. <br />
    </Typography>
  </Alert>
)
