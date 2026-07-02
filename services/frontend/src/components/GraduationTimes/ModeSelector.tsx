import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { GraduationView } from '.'

export const GraduationModeSelector = ({
  value,
  setValue,
  header,
  disabled,
}: {
  value: GraduationView
  setValue: React.Dispatch<React.SetStateAction<GraduationView>>
  header?: string
  disabled?: boolean
}) => (
  <FormControl>
    {!!header && <FormLabel sx={{ alignSelf: 'center' }}>{header}</FormLabel>}
    <RadioGroup onChange={e => setValue(e.target.value as GraduationView)} row value={value}>
      <FormControlLabel
        control={<Radio disabled={disabled} />}
        label="Breakdown"
        slotProps={{ typography: { fontWeight: value === 'breakdown' ? 'bold' : undefined } }}
        value="breakdown"
      />
      <FormControlLabel
        control={<Radio disabled={disabled} />}
        label="Median"
        slotProps={{ typography: { fontWeight: value === 'median' ? 'bold' : undefined } }}
        value="median"
      />
      <FormControlLabel
        control={<Radio disabled={disabled} />}
        label="Average"
        slotProps={{ typography: { fontWeight: value === 'average' ? 'bold' : undefined } }}
        value="average"
      />
    </RadioGroup>
  </FormControl>
)
