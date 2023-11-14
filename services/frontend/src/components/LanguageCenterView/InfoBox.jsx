import React, { useState } from 'react'
import { Button, Icon, Message } from 'semantic-ui-react'

export const InfoBox = () => {
  const [open, setOpen] = useState(false)
  return (
    <Message style={{ maxWidth: '60em' }}>
      <p>This view displays amounts of enrollments and completions of courses organized by language center.</p>
      <p>You can view the numbers by faculties or by semesters.</p>
      {open && (
        <div>
          <ul>
            <li>
              <b>Show number of:</b>
            </li>
            <ul>
              <li>Completions: Amount of passed completions of course</li>
              <li>Enrollments: Amount of accepted enrollments on course</li>
              <li>
                Ratio: Percentage of completions per enrollments. 0 % means there are zero completions and at least one
                enrollment. 100 % means there are at least as many completions as enrollments. A dash indicates there
                are no completions or enrollments. Hover mouse over a cell to view the amount of enrollments and
                completions.
              </li>
            </ul>
            <li>
              <b>Coloring mode: </b>Only available in "by semesters" -tab. Change this to compare a course's popularity
              to other courses, or to its own average in time.
            </li>
          </ul>
          <p>Tips:</p>
          <ul>
            <li>Hover your mouse over the faculty column header to see the name of the faculty</li>
            <li>
              When in ratio mode, hover your mouse over the cells to see the numbers of completions and enrollments.
            </li>
            <li>
              Click the column headers to sort by the column, or click the filter icon{' '}
              <Icon name="filter" style={{ color: '#bbb' }} /> (appears when hovering mouse on column header) to set a
              filter on that column.
            </li>
            <li>
              <b>Example of viewing all courses of a language</b>: Click the filter-icon
              <Icon name="filter" style={{ color: '#bbb' }} />. Type "KK-ESP" and press enter. Now only the courses
              whose code contains "KK-ESP" will be shown. Notice that the total-row on top of the table still shows
              numbers from all courses.
            </li>
          </ul>
          <p>
            This is a new feature. Suggestions for improvement or questions are welcomed to grp-toska@helsinki.fi or via
            the <a href="https://oodikone.helsinki.fi/feedback">feedback form</a>.
          </p>
        </div>
      )}
      <Button style={{ marginTop: '20px' }} onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show more info'}
      </Button>
    </Message>
  )
}
