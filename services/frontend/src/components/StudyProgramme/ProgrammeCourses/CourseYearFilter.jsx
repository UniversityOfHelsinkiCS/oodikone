import React from 'react'
import { Form } from 'semantic-ui-react'

import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { Toggle } from '../Toggle'

export const CourseYearFilter = ({ years, fromYear, toYear, handleChange, academicYear = false, setAcademicYear }) =>
  years ? (
    <div className="toggle-container" data-cy="CoursesYearFilter">
      <div style={{ marginTop: '0.5rem' }}>
        <Form>
          <Form.Group inline>
            <Form.Dropdown
              data-cy="fromYear"
              inline
              label="From:"
              name="fromYear"
              onChange={handleChange}
              options={toYear ? years.filter(({ value }) => value <= toYear) : years}
              placeholder="Select what ever year"
              selectOnBlur={false}
              selectOnNavigation={false}
              selection
              value={fromYear}
            />
            <Form.Dropdown
              data-cy="toYear"
              inline
              label="To:"
              name="toYear"
              onChange={handleChange}
              options={fromYear ? years.filter(({ value }) => value >= fromYear) : years}
              placeholder="Select ending year"
              selectOnBlur={false}
              selectOnNavigation={false}
              selection
              value={toYear}
            />
          </Form.Group>
        </Form>
      </div>
      <Toggle
        cypress="calendarAcademicYearToggle"
        firstLabel="Calendar year"
        secondLabel="Academic year"
        setValue={setAcademicYear}
        toolTips={studyProgrammeToolTips.YearToggle}
        value={academicYear}
      />
    </div>
  ) : null
