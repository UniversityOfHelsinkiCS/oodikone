import React, { useMemo } from 'react'
import { Dropdown, Radio } from 'semantic-ui-react'

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
      {modes.map(mode => (
        <Radio
          checked={numberMode === mode.value}
          data-cy={`${mode.value}-button`}
          key={mode.value}
          label={mode.label}
          name="modeRadioGroup"
          onChange={() => setNumberMode(mode.value)}
          value={mode.value}
        />
      ))}
    </div>
  )
}

export const ColorModeSelector = () => {
  const { colorMode, setColorMode } = useColorizedCoursesTableContext()

  return (
    <div className="selector-container">
      <b>Coloring mode</b>
      <Radio
        checked={colorMode === 'course'}
        label="Compare to average of course"
        name="colorModeGroup"
        onChange={() => setColorMode('course')}
        value="course"
      />
      <Radio
        checked={colorMode === 'total'}
        label="Compare to other courses"
        name="colorModeGroup"
        onChange={() => setColorMode('total')}
        value="total"
      />
      <Radio
        checked={colorMode === 'none'}
        label="No colors"
        name="colorModeGroup"
        onChange={() => setColorMode('none')}
        value="none"
      />
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
      <Dropdown
        data-cy={dataCy}
        onChange={(_, { value }) =>
          setSemester(allSemesters.find(({ semestercode }) => semestercode === value).semestercode)
        }
        options={options}
        value={currentValue.semestercode}
      />
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
        {semesters && (
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
        )}
      </div>
    </div>
  )
}
