import { useLanguage } from 'components/LanguagePicker/useLanguage'
import React, { useMemo } from 'react'
import { Dropdown, Radio } from 'semantic-ui-react'
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
          data-cy={`${mode.value}-button`}
          name="modeRadioGroup"
          value={mode.value}
          label={mode.label}
          key={mode.value}
          onChange={() => setNumberMode(mode.value)}
          checked={numberMode === mode.value}
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
        name="colorModeGroup"
        value="course"
        label="Compare to average of course"
        onChange={() => setColorMode('course')}
        checked={colorMode === 'course'}
      />
      <Radio
        name="colorModeGroup"
        value="total"
        label="Compare to other courses"
        onChange={() => setColorMode('total')}
        checked={colorMode === 'total'}
      />
      <Radio
        name="colorModeGroup"
        value="none"
        label="No colors"
        onChange={() => setColorMode('none')}
        checked={colorMode === 'none'}
      />
    </div>
  )
}

const SemesterSelector = ({ allSemesters, semester, setSemester, dataCy }) => {
  const { getTextIn } = useLanguage()
  const currentValue = allSemesters.find(({ semestercode }) => semester === semestercode) ?? allSemesters[0]
  const options = useMemo(
    () => allSemesters.map(s => ({ key: s.semestercode, text: getTextIn(s.name), value: s.semestercode })),
    [allSemesters]
  )

  return (
    <div className="selector-container">
      <Dropdown
        data-cy={dataCy}
        onChange={(_, { value }) =>
          setSemester(allSemesters.find(({ semestercode }) => semestercode === value).semestercode)
        }
        value={currentValue.semestercode}
        options={options}
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
          dataCy="semester-from"
          setSemester={semester => {
            setSemesterFilter({
              end: semesterFilter.end < semester ? semester : semesterFilter.end,
              start: semester,
            })
          }}
          semester={semesterFilter?.start}
          allSemesters={semesters}
        />
      </div>
      <div>
        <b>Until</b>
        {semesters && (
          <SemesterSelector
            dataCy="semester-to"
            allSemesters={semesters?.filter(s => {
              return semesterFilter.start <= s.semestercode
            })}
            setSemester={semester => {
              setSemesterFilter({ ...semesterFilter, end: semester })
            }}
            semester={semesterFilter?.end}
          />
        )}
      </div>
    </div>
  )
}
