import React from 'react'
import { Message } from 'semantic-ui-react'

import { FacultySegment } from './FacultySegment'

export const FacultySelector = ({ faculties, selected }) => {
  if (selected) return null

  if (faculties == null) {
    return <Message>You do not have access to any faculties</Message>
  }

  return (
    <div data-cy="select-faculty">
      {faculties.map(faculty => (
        <FacultySegment faculty={faculty} key={faculty.code} />
      ))}
    </div>
  )
}
