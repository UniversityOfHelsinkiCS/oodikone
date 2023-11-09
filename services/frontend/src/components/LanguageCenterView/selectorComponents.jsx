/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import React, { useMemo } from 'react'
import { Dropdown, Radio } from 'semantic-ui-react'
import { useLanguageCenterContext } from './common'
import './index.css'

export const CompletionPicker = ({ enableRatioOption }) => {
  const { numberMode, setNumberMode } = useLanguageCenterContext()

  return (
    <div className="completion-container">
      <div className="completion-acual-container">
        <b className="completion-header">Show number of</b>
        <Radio
          name="modeRadioGroup"
          value="completed"
          label="Completions"
          onChange={() => setNumberMode('completed')}
          checked={numberMode === 'completed'}
        />
        <Radio
          name="modeRadioGroup"
          value="notCompleted"
          label="Enrollments"
          onChange={() => setNumberMode('notCompleted')}
          checked={numberMode === 'notCompleted'}
        />
        {enableRatioOption && (
          <Radio
            name="modeRadioGroup"
            value="ratio"
            label="Ratio of credits per enrollments"
            onChange={() => setNumberMode('ratio')}
            checked={numberMode === 'ratio'}
          />
        )}
      </div>
    </div>
  )
}

export const ColorModeSelector = () => {
  const { colorMode, setColorMode } = useLanguageCenterContext()

  return (
    <div className="colormodeselector-container">
      <div className="colormodeselector-acual-container">
        <b className="colormodeselector-header">Coloring mode</b>
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
    </div>
  )
}

export const SemesterSelector = ({ allSemesters, semester, setSemester }) => {
  const { getTextIn } = useLanguage()
  const currentValue = allSemesters.find(({ semestercode }) => semester === semestercode) ?? allSemesters[0]
  const options = useMemo(
    () => allSemesters.map(s => ({ key: s.semestercode, text: getTextIn(s.name), value: s.semestercode })),
    [allSemesters]
  )

  return (
    <div>
      <Dropdown
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
    <div className="datepicker-container">
      <div className="datepicker-acual-container">
        <div>
          <b>From</b>
          <SemesterSelector
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
    </div>
  )
}
