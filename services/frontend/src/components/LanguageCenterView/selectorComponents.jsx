/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import React, { useMemo } from 'react'
import { Dropdown, Radio } from 'semantic-ui-react'

export const CompletionPicker = ({ mode, setMode }) => {
  return (
    <div className="completion-container">
      <div className="completion-icon-container" />
      <b className="options-header">Course completion</b>
      <div className="completion-acual-container" />
      <div>
        <Radio
          name="modeRadioGroup"
          value="notCompleted"
          label="Enrolled but not passed"
          onChange={() => setMode('notCompleted')}
          checked={mode === 'notCompleted'}
        />
      </div>
      <div>
        <Radio
          name="modeRadioGroup"
          value="completed"
          label="Passed"
          onChange={() => setMode('completed')}
          checked={mode === 'completed'}
        />
      </div>
      <div>
        <Radio
          name="modeRadioGroup"
          value="total"
          label="Both"
          onChange={() => setMode('total')}
          checked={mode === 'total'}
        />
      </div>
    </div>
  )
}

export const SemesterSelector = ({ allSemesters, semester, setSemester }) => {
  const { getTextIn } = useLanguage()
  const currentValue =
    allSemesters.find(({ semestercode }) => semester.semestercode === semestercode) ?? allSemesters[0]
  const options = useMemo(
    () => allSemesters.map(s => ({ key: s.semestercode, text: getTextIn(s.name), value: s.semestercode })),
    [allSemesters]
  )

  return (
    <div>
      <Dropdown
        onChange={(_, { value }) => setSemester(allSemesters.find(({ semestercode }) => semestercode === value))}
        value={currentValue.semestercode}
        options={options}
      />
    </div>
  )
}
