import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { Link } from '@/components/common/Link'
import { StyledTable } from '@/components/common/StyledTable'
import { TableHeaderWithTooltip } from '@/components/common/TableHeaderWithTooltip'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { CombinedDegreeProgramme } from '@/pages/StudyProgramme/StudyProgrammeSelector/'
import { useAddStudyProgrammePinMutation, useRemoveStudyProgrammePinMutation } from '@/redux/studyProgrammePins'
import { PushPinIcon } from '@/theme'
import { ProgrammeModuleWithRelevantAttributes } from '@oodikone/shared/types'

export const StudyProgrammeTable = ({
  header,
  pinnedProgrammes,
  programmes,
  visible = true,
}: {
  header: string
  pinnedProgrammes: string[]
  programmes: (ProgrammeModuleWithRelevantAttributes | CombinedDegreeProgramme)[]
  visible?: boolean
}) => {
  const { getTextIn } = useLanguage()

  const [addStudyProgrammePins] = useAddStudyProgrammePinMutation()
  const [removeStudyProgrammePins] = useRemoveStudyProgrammePinMutation()

  if (!visible || programmes == null || programmes.length === 0) {
    return null
  }

  return (
    <Stack direction="column" gap={1}>
      <Typography component="h3" variant="h6">
        {header}
      </Typography>
      <StyledTable slimBody slimHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 100 }}>Code</TableCell>
            <TableCell sx={{ width: 100 }}>Id</TableCell>
            <TableCell sx={{ minWidth: 160 }}>Name</TableCell>
            <TableCell sx={{ width: 80 }}>
              <TableHeaderWithTooltip
                header="Pin"
                tooltipText={`
                  Click the pin icon to pin/unpin a programme.
                  Pinned programmes are shown first here and in the degree programme search in Class statistics.
                `}
              />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {programmes.map(programme => (
            <TableRow key={programme?.code}>
              <TableCell>{programme?.code}</TableCell>
              <TableCell>{programme?.progId}</TableCell>
              <TableCell>
                <Link to={`/study-programme/${programme?.code}`}>{getTextIn(programme?.name)}</Link>
              </TableCell>
              <TableCell>
                {
                  <IconButton
                    data-cy={`pin-programme-${programme?.code}-button`}
                    onClick={
                      pinnedProgrammes.includes(programme?.code)
                        ? () => void removeStudyProgrammePins({ programmeCode: programme?.code })
                        : () => void addStudyProgrammePins({ programmeCode: programme?.code })
                    }
                    sx={{
                      color: theme =>
                        pinnedProgrammes.includes(programme?.code)
                          ? theme.palette.studyProgrammePin.pinned
                          : theme.palette.studyProgrammePin.unpinned,
                    }}
                  >
                    <PushPinIcon fontSize="small" />
                  </IconButton>
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </Stack>
  )
}
