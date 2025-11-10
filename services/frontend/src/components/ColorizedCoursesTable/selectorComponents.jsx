import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'

import Select from '@mui/material/Select'
import { useMemo } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useColorizedCoursesTableContext } from './common'
import './index.css'

export const NumberModeSelector = () => {
  const { numberMode, setNumberMode } = useColorizedCoursesTableContext()
  const modes = [
    { value: 'completions', label: 'Completions' },
    { value: 'enrollments', label: 'Accepted enrollments' },
    { value: 'difference', label: 'Accepted enrollments exceeding completions' },
    { value: 'rejected', label: 'Rejected enrollments' },
  ]

  return (
    <div className="selector-container">
      <b>Show number of</b>
      <RadioGroup>
        {modes.map(mode => (
          <FormControlLabel
            checked={numberMode === mode.value}
            control={<Radio />}
            data-cy={`${mode.value}-button`}
            key={mode.value}
            label={mode.label}
            onChange={() => setNumberMode(mode.value)}
            value={mode.value}
          />
        ))}
      </RadioGroup>
    </div>
  )
}

export const ColorModeSelector = () => {
  const { colorMode, setColorMode } = useColorizedCoursesTableContext()

  return (
    <div className="selector-container">
      <b>Coloring mode</b>
      <RadioGroup>
        <FormControlLabel
          checked={colorMode === 'course'}
          control={<Radio />}
          label="Compare to average of course"
          onChange={() => setColorMode('course')}
          value="course"
        />
        <FormControlLabel
          checked={colorMode === 'total'}
          control={<Radio />}
          label="Compare to other courses"
          onChange={() => setColorMode('total')}
          value="total"
        />
        <FormControlLabel
          checked={colorMode === 'none'}
          control={<Radio />}
          label="No colors"
          onChange={() => setColorMode('none')}
          value="none"
        />
      </RadioGroup>
    </div>
  )
}

const SemesterSelector = ({ allSemesters, semester, setSemester, dataCy }) => {
  const { getTextIn } = useLanguage()
  const currentValue = allSemesters.find(({ semestercode }) => semester === semestercode) ?? allSemesters[0]
  const options = useMemo(
    () =>
      allSemesters.map(semester => ({
        key: semester.semestercode,
        text: getTextIn(semester.name),
        value: semester.semestercode,
      })),
    [allSemesters]
  )

  return (
    <div className="selector-container">
      <Select
        data-cy={dataCy}
        onChange={event =>
          setSemester(allSemesters.find(({ semestercode }) => semestercode === event.target.value).semestercode)
        }
        value={currentValue.semestercode}
      >
        {options.map(({ key, text, value }) => (
          <MenuItem data-cy={`select-opt-${text}`} key={key} value={value}>
            {text}
          </MenuItem>
        ))}
      </Select>
    </div>
  )
}

export const SemesterRangeSelector = () => {
  const { semesters, semesterFilter, setSemesterFilter } = useColorizedCoursesTableContext()

  return (
    <div className="selector-container">
      <div>
        <b>From</b>
        <SemesterSelector
          allSemesters={semesters}
          dataCy="semester-from"
          semester={semesterFilter?.start}
          setSemester={semester => {
            setSemesterFilter({
              end: semesterFilter.end < semester ? semester : semesterFilter.end,
              start: semester,
            })
          }}
        />
      </div>
      <div>
        <b>Until</b>
        {semesters ? (
          <SemesterSelector
            allSemesters={semesters?.filter(semester => {
              return semesterFilter.start <= semester.semestercode
            })}
            dataCy="semester-to"
            semester={semesterFilter?.end}
            setSemester={semester => {
              setSemesterFilter({ ...semesterFilter, end: semester })
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
