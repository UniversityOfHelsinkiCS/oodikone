import React, { Fragment } from 'react'
import { shape } from 'prop-types'
import { Message } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import TeacherSearch from '../TeacherSearch'

const TeacherSearchTab = ({ history }) => (
  <Fragment>
    <Message header="Teacher search" content="Search for a teacher and click the search result to view their individual statistics from their entire career. " />
    <TeacherSearch
      onClick={teacher => (history.push(`/teachers/${teacher.id}`))}
      icon="level up alternate"
    />
  </Fragment>
)

TeacherSearchTab.propTypes = {
  history: shape({}).isRequired
}

export default withRouter(TeacherSearchTab)
