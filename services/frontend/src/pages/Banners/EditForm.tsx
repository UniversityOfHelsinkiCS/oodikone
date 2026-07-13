import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import Grid2 from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Banner } from '@/components/Banner/Banner'
import { Section } from '@/components/Section'
import { Banner as TBanner } from '@oodikone/shared/models/kone'

const generateFallbackValues = () => {
  const now = new Date()
  const inAWeek = new Date()
  inAWeek.setDate(now.getDate() + 7)

  return {
    startDate: now,
    endDate: inAWeek,
    text: 'A very important piece of knowledge to share with the world',
    color: 'info',
    lightness: 'main',
  }
}

export const BannerEditForm = ({ initialValues, onSave }) => {
  const isNew = initialValues === null

  const [values, setValues] = useState<TBanner>({
    ...generateFallbackValues(),
    ...initialValues,
  })

  const handleValueChange = (key: string, value: Date | string | null) => {
    if (!value) return
    setValues(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <>
      <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Banner banner={values} />
        <Chip
          color="secondary"
          label="Preview mode"
          sx={{ my: 2, outline: '1px solid white', borderRadius: 0, mx: 'auto' }}
        />
      </Box>

      <Section title="DKN-BE (Oodikone Banner Editor)">
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Text content"
            minRows={3}
            multiline
            name="text"
            onChange={({ target: { value, name } }) => handleValueChange(name, value)}
            type="color"
            value={values.text}
          />
          <Grid2 container>
            <Grid2 size={6} sx={{ pr: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="color-label">Color</InputLabel>
                <Select
                  label="Color"
                  labelId="Color"
                  name="color"
                  onChange={({ target: { value, name } }) => handleValueChange(name, value)}
                  type="color"
                  value={values.color}
                >
                  <MenuItem value={'white'}>White</MenuItem>
                  <MenuItem value={'dark'}>Black</MenuItem>
                  <MenuItem value={'info'}>Blue</MenuItem>
                  <MenuItem value={'success'}>Green</MenuItem>
                  <MenuItem value={'warning'}>Orange</MenuItem>
                  <MenuItem value={'error'}>Red</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 size={6} sx={{ pl: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="lightness-label">Color brightness</InputLabel>
                <Select
                  fullWidth
                  label="Color brightness"
                  labelId="lightness-label"
                  name="lightness"
                  onChange={({ target: { value, name } }) => handleValueChange(name, value)}
                  value={values.lightness}
                >
                  <MenuItem value={'light'}>Light</MenuItem>
                  <MenuItem value={'main'}>Regular</MenuItem>
                  <MenuItem value={'dark'}>Dark</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
          </Grid2>
          <Grid2 container>
            <Grid2 size={6} sx={{ pr: 1 }}>
              <DateTimePicker
                format="L HH:mm"
                label="Start date"
                name="startDate"
                onChange={date => {
                  if (date) handleValueChange('startDate', date.toDate())
                }}
                sx={{ width: '100%' }}
                value={dayjs(values.startDate)}
              />
            </Grid2>
            <Grid2 size={6} sx={{ pl: 1 }}>
              <DateTimePicker
                format="L HH:mm"
                label="End date"
                name="endDate"
                onChange={date => {
                  if (date) handleValueChange('endDate', date.toDate())
                }}
                sx={{ width: '100%' }}
                value={dayjs(values.endDate)}
              />
            </Grid2>
          </Grid2>
          <Button onClick={() => onSave(values, false, isNew)} type="submit" variant="contained">
            {isNew ? 'Create' : 'Save'}
          </Button>
        </Stack>
      </Section>
    </>
  )
}
