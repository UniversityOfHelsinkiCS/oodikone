import React, { Fragment } from 'react'
import { Form } from 'semantic-ui-react'
import Toggle from '../Toggle'
import InfotoolTips from '../../../common/InfoToolTips'

const CourseYearFilter = ({ years, fromYear, toYear, handleChange, academicYear = false, setAcademicYear }) => {
  const toolTips = InfotoolTips.Studyprogramme
  return (
    <>
      <div className="toggle-container" data-cy="CoursesYearFilter">
        <div style={{ marginTop: '0.5rem' }}>
          <Form>
            <Form.Group inline>
              <Form.Dropdown
                label="From:"
                name="fromYear"
                options={toYear ? years.filter(({ value }) => value <= toYear) : years}
                selection
                inline
                placeholder="Select what ever year"
                onChange={handleChange}
                value={fromYear}
                selectOnBlur={false}
                selectOnNavigation={false}
              />
              <Form.Dropdown
                label="To:"
                name="toYear"
                options={fromYear ? years.filter(({ value }) => value >= fromYear) : years}
                selection
                inline
                placeholder="Select ending year"
                onChange={handleChange}
                value={toYear}
                selectOnBlur={false}
                selectOnNavigation={false}
              />
            </Form.Group>
          </Form>
        </div>
        <Toggle
          cypress="courses_yearToggle"
          toolTips={toolTips.YearToggle}
          firstLabel="Calendar year"
          secondLabel="Academic year"
          value={academicYear}
          setValue={setAcademicYear}
        />
      </div>
    </>
  )
}

export default CourseYearFilter
