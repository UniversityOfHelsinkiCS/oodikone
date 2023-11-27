import React from 'react'
import { Message } from 'semantic-ui-react'
import { useHistory } from 'react-router-dom'

import { TeacherSearch } from '../TeacherSearch'

export const TeacherSearchTab = () => {
  const history = useHistory()
  return (
    <>
      <Message
        header="Teacher search"
        content="Search for a teacher and click the search result to view their individual statistics from their entire career. "
      />
      <TeacherSearch onClick={teacher => history.push(`/teachers/${teacher.id}`)} />
    </>
  )
}
