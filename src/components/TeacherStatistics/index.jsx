import React, { Component } from 'react'
import { connect } from 'react-redux'
import { shape, string } from 'prop-types'
import { Header, Segment } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import sharedStyles from '../../styles/shared'
import TeacherSearch from '../TeacherSearch'
import TeacherDetails from '../TeacherDetails'

class StudentStatistics extends Component {
    state = {}

    render() {
      const { match } = this.props
      const { teacherid } = match.params
      return (
        <div className={sharedStyles.segmentContainer}>
          <Header className={sharedStyles.segmentTitle} size="large">
            Teacher statistics
          </Header>
          <Segment className={sharedStyles.contentSegment}>
            { teacherid ? <TeacherDetails teacher={teacherid} /> : <TeacherSearch content="Stats" />}
          </Segment>
        </div>
      )
    }
}

StudentStatistics.propTypes = {
  match: shape({
    params: shape({
      teacherid: string
    })
  })
}

StudentStatistics.defaultProps = {
  match: {
    params: { teacherid: undefined }
  }
}

const mapStateToProps = () => ({})
const mapDispatchToProps = () => ({})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StudentStatistics))
