/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import React, { useMemo } from 'react'
import { Dropdown, Radio } from 'semantic-ui-react'
import { useLanguageCenterContext } from './common'
import './index.css'

export const CompletionPicker = ({ enableRatioOption }) => {
  const { numberMode, setNumberMode } = useLanguageCenterContext()

  return (
    <div className="selector-container">
      <b>Show number of</b>
      <Radio
        data-cy="completions-button"
        name="modeRadioGroup"
        value="completions"
        label="Completions"
        onChange={() => setNumberMode('completions')}
        checked={numberMode === 'completions'}
      />
      <Radio
        data-cy="enrollments-button"
        name="modeRadioGroup"
        value="enrollments"
        label="Enrollments"
        onChange={() => setNumberMode('enrollments')}
        checked={numberMode === 'enrollments'}
      />
      {enableRatioOption && (
        <Radio
          name="modeRadioGroup"
          value="ratio"
          data-cy="ratio-button"
          label="Ratio of completions per enrollments"
          onChange={() => setNumberMode('ratio')}
          checked={numberMode === 'ratio'}
        />
      )}
    </div>
  )
}

export const ColorModeSelector = () => {
  const { colorMode, setColorMode } = useLanguageCenterContext()

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

export const SemesterSelector = ({ allSemesters, semester, setSemester, dataCy }) => {
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
  const { semesters, semesterFilter, setSemesterFilter } = useLanguageCenterContext()

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
