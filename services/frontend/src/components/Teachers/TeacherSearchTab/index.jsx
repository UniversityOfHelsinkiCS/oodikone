import React from 'react'
import { shape } from 'prop-types'
import { Message } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'

import { TeacherSearch } from '../TeacherSearch'

const TeacherSearchTab = ({ history }) => (
  <>
    <Message
      header="Teacher search"
      content="Search for a teacher and click the search result to view their individual statistics from their entire career. "
    />
    <TeacherSearch onClick={teacher => history.push(`/teachers/${teacher.id}`)} />
  </>
)

TeacherSearchTab.propTypes = {
  history: shape({}).isRequired,
}

export default withRouter(TeacherSearchTab)
