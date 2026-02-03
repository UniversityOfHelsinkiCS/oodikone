import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { useCallback, useState } from 'react'

import { KeyboardArrowDownIcon, KeyboardArrowUpIcon } from '@/theme'

/**
 * Numeric TextField component with internal state, that can be used where debouncing is wanted
 */
export const NumericTextField = ({
  initialValue,
  onChange,
  disabled,
}: {
  initialValue: number
  onChange: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>
  disabled: boolean
}) => {
  const [value, setValue] = useState(initialValue)

  const emitChange = useCallback(
    (next: number) => {
      onChange({ target: { value: String(next) } } as React.ChangeEvent<HTMLInputElement>)
    },
    [onChange]
  )

  const handleIncrement = useCallback(() => {
    const next = value + 1
    setValue(next)
    emitChange(next)
  }, [value, emitChange])

  const handleDecrement = useCallback(() => {
    const next = value - 1
    setValue(next)
    emitChange(next)
  }, [value, emitChange])

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
    event => {
      const raw = event.target.value.trim()
      if (raw === '') {
        setValue(0)
        onChange(event as React.ChangeEvent<HTMLInputElement>)
        return
      }
      const parsed = Number(raw)
      if (!Number.isNaN(parsed)) {
        setValue(parsed)
        onChange({
          ...event,
          target: { ...(event.target as HTMLInputElement), value: String(parsed) },
        } as React.ChangeEvent<HTMLInputElement>)
      }
    },
    [onChange]
  )

  return (
    <TextField
      disabled={disabled}
      inputMode="numeric"
      onChange={handleInputChange}
      size="small"
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment
              position="end"
              sx={{
                flexDirection: 'column',
                alignSelf: 'stretch',
                '& button': {
                  py: 0,
                  flex: 1,
                  borderRadius: 0.5,
                },
              }}
            >
              <IconButton disabled={disabled} onClick={handleIncrement} size="small">
                <KeyboardArrowUpIcon fontSize="small" sx={{ transform: 'translateY(2px)' }} />
              </IconButton>
              <IconButton disabled={disabled} onClick={handleDecrement} size="small">
                <KeyboardArrowDownIcon fontSize="small" sx={{ transform: 'translateY(-2px)' }} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={{
        maxWidth: '6em',
        '& .MuiInputBase-root': { pr: 0 },
      }}
      type="text"
      value={value}
    />
  )
}
