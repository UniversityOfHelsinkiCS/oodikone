import React from 'react'
import { useHistory } from 'react-router-dom'
import { Message } from 'semantic-ui-react'

import { TeacherSearch } from '../TeacherSearch'

export const TeacherSearchTab = () => {
  const history = useHistory()
  return (
    <>
      <Message
        content="Search for a teacher and click the search result to view their individual statistics from their entire career. "
        header="Teacher search"
      />
      <TeacherSearch onClick={teacher => history.push(`/teachers/${teacher.id}`)} />
    </>
  )
}
