/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import React, { useMemo } from 'react'
import { Button, Dropdown, Icon, Radio } from 'semantic-ui-react'
import { useLanguageCenterContext } from './common'
import './index.css'

export const CompletionPicker = () => {
  const { mode, setMode } = useLanguageCenterContext()

  return (
    <div className="completion-container">
      <div className="completion-acual-container">
        <b className="completion-header">Course completion</b>
        <Radio
          name="modeRadioGroup"
          value="notCompleted"
          label="Enrolled but not passed"
          onChange={() => setMode('notCompleted')}
          checked={mode === 'notCompleted'}
        />
        <Radio
          name="modeRadioGroup"
          value="completed"
          label="Passed"
          onChange={() => setMode('completed')}
          checked={mode === 'completed'}
        />
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

export const ApplyFiltersButton = () => {
  const { filters, dates, mode, setFilters } = useLanguageCenterContext()
  return (
    <div className="button-container">
      <Button
        disabled={filters.startDate === dates.startDate && filters.endDate === dates.endDate && filters.mode === mode}
        onClick={() => setFilters({ mode, ...dates })}
        color="green"
      >
        Apply filters
      </Button>
    </div>
  )
}

export const SemesterRangeSelector = () => {
  const { semesters, dates, setDates } = useLanguageCenterContext()
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
              setDates({
                endDate: dates.endDate.semestercode < semester.semestercode ? semester : dates.endDate,
                startDate: semester,
              })
            }}
            semester={dates?.startDate}
            allSemesters={semesters}
          />
        </div>
        <div>
          <b>Until</b>
          {semesters && (
            <SemesterSelector
              allSemesters={semesters?.filter(s => {
                return dates.startDate.semestercode <= s.semestercode
              })}
              setSemester={semester => setDates({ ...dates, endDate: semester })}
              semester={dates?.endDate}
            />
          )}
        </div>
      </div>
    </div>
  )
}
