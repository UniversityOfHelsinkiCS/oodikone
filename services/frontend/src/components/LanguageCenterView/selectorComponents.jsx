/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import React, { useMemo } from 'react'
import { Dropdown, Icon, Radio } from 'semantic-ui-react'
import { useLanguageCenterContext } from './common'
import './index.css'

export const CompletionPicker = () => {
  const { mode, setMode } = useLanguageCenterContext()

  return (
    <div className="completion-container">
      <div className="completion-acual-container">
        <b className="completion-header">Show number of enrollments or completions</b>
        <Radio
          name="modeRadioGroup"
          value="completed"
          label="Completions"
          onChange={() => setMode('completed')}
          checked={mode === 'completed'}
        />
        <Radio
          name="modeRadioGroup"
          value="notCompleted"
          label="Enrollments"
          onChange={() => setMode('notCompleted')}
          checked={mode === 'notCompleted'}
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
        <div className="calendar-icon-container">
          <Icon size="big" name="calendar alternate outline" />
        </div>
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
