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
              <li>Completions: Amount of passed completions of a course</li>
              <li>Enrollments: Amount of accepted enrollments on a course</li>
              <li>
                Enrollments exceeding completions: For every course per semester, the amount of accepted enrollments
                that exceeded the amount of completions.
              </li>
              <li>Rejected: Amount of rejected enrollments on a course</li>
            </ul>
            <li>
              <b>Coloring mode: </b>Change this to compare a course's popularity to other courses, or to its own average
              in time.
            </li>
          </ul>
          <p>Tips:</p>
          <ul>
            <li>
              Hover your mouse over the faculty column header to see the name of the faculty. The same is possible with
              long course names.
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
