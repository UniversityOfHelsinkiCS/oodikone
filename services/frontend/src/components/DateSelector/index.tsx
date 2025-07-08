import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { DatePicker } from '@mui/x-date-pickers/DatePicker/DatePicker'

import dayjs from 'dayjs'
import { useRef, type MutableRefObject } from 'react'
import 'dayjs/locale/fi'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import { useGetSemestersQuery, type SemestersData } from '@/redux/semesters'

export const DateSelector = ({ value, onChange, before, after, showSemesters }) => {
  const datetimeRef: MutableRefObject<HTMLInputElement | null> = useRef(null)
  const { data: semesters, isFetching } = useGetSemestersQuery()
  const { semesters: allSemesters } = semesters ?? ({ semesters: {} } as SemestersData)
  const { getTextIn } = useLanguage()

  if (isFetching) return null

  const today = dayjs().startOf('day')

  const triggerOnChange = date => {
    if (datetimeRef.current !== date) {
      datetimeRef.current = date
      onChange(datetimeRef.current)
    }
  }

  const createDateButton = (date, label) => (
    <Button
      key={label}
      onClick={() => triggerOnChange(date)}
      size="small"
      sx={{
        background: 'primary.light',
        color: value?.isSame(date, 'day') ? 'primary.light' : 'text.primary',
      }}
      variant="outlined"
    >
      {label}
    </Button>
  )

  const CustomPicker = _ => {
    return (
      <Box sx={{ padding: '0 0.5em' }}>
        <Typography sx={{ paddingLeft: '0.3em', fontWeight: 'bold' }}>Semesters:</Typography>
        <List
          sx={{
            overflowY: 'auto',
            margin: 0,
            padding: '0.5em 0',
            maxHeight: '10em',
            borderTop: '1px solid #f9f9f9',
          }}
        >
          {Object.values(allSemesters)
            .filter(({ startdate, enddate }) => {
              const start = dayjs(startdate)
              const end = dayjs(enddate)

              return start.isBefore() && (!before || start.isBefore(before)) && (!after || end.isAfter(after))
            })
            .sort(({ startdate: a }, { startdate: b }) => new Date(b).getTime() - new Date(a).getTime())
            .map(({ name, startdate, enddate }) => (
              <ListItem
                key={`${getTextIn(name)}-${Math.random()}`}
                sx={{ padding: '0.2em 0.3em 0.2em', display: 'flex', alignItems: 'center' }}
              >
                <Typography sx={{ flexGrow: 1 }}>{getTextIn(name)}</Typography>
                <Typography sx={{ margin: '0 0.25em' }}>{createDateButton(dayjs(startdate), 'Start')}</Typography>
                <Typography>{createDateButton(dayjs(enddate).subtract(1, 'days'), 'End')}</Typography>
              </ListItem>
            ))}
        </List>
      </Box>
    )
  }

  return (
    <DatePicker
      className="date-picker"
      format={DateFormat.DISPLAY_DATE}
      formatDensity="dense"
      inputRef={datetimeRef}
      maxDate={dayjs(before ?? today)}
      minDate={after ? dayjs(after) : undefined}
      onChange={onChange}
      reduceAnimations
      showDaysOutsideCurrentMonth
      // @ts-expect-error HACK: there should be a custom component that eats the picker
      slots={{ tabs: showSemesters && CustomPicker }}
      value={value}
    />
  )
}
