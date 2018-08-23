import React, { Component } from 'react'
import { shape, string } from 'prop-types'
import { Header, Segment, Tab } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import sharedStyles from '../../styles/shared'
import TeacherSearch from '../TeacherSearch'
import TeacherPage from '../TeacherPage'
import TeacherStatistics from '../TeacherStatistics'

const pane = (title, Content) => ({
  menuItem: title,
  render: () => (
    <Tab.Pane style={{ borderWidth: '0' }}>
      <Content />
    </Tab.Pane>
  )
})

const TeachersTabs = () => (
  <Tab
    menu={{ attached: false, borderless: true, tabular: true }}
    panes={[
      pane('Statistics', TeacherStatistics),
      pane('Search', TeacherSearch)
    ]}
  />
)

class Teachers extends Component {
    state = {}

    render() {
      const { match } = this.props
      const { teacherid } = match.params
      return (
        <div className={sharedStyles.segmentContainer}>
          <Header className={sharedStyles.segmentTitle} size="large" content="Teacher statistics" />
          <Segment className={sharedStyles.contentSegment}>
            { teacherid
              ? <TeacherPage teacherid={teacherid} />
              : <TeachersTabs />
            }
          </Segment>
        </div>
      )
    }
}

Teachers.propTypes = {
  match: shape({
    params: shape({
      teacherid: string
    })
  })
}

Teachers.defaultProps = {
  match: {
    params: { teacherid: undefined }
  }
}

export default withRouter(Teachers)
