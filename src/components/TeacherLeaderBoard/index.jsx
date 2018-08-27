import React, { Component } from 'react'
import { Segment, Message } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, arrayOf, bool, shape } from 'prop-types'
import { getTopTeachers } from '../../redux/teachersTop'
import TeacherStatisticsTable from '../TeacherStatisticsTable'

class TeacherLeaderBoard extends Component {
    state={}

    componentDidMount() {
      this.props.getTopTeachers()
    }

    render() {
      const { statistics, isLoading } = this.props
      return (
        <div>
          <Message
            header="Teacher leaderboard"
            content="Teachers who have produced the most credits from all departments."
          />
          <Segment>
            { isLoading
                ? <Segment basic loading={isLoading} />
                : <TeacherStatisticsTable statistics={statistics} />}
          </Segment>
        </div>
      )
    }
}

TeacherLeaderBoard.propTypes = {
  getTopTeachers: func.isRequired,
  isLoading: bool.isRequired,
  statistics: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ teachersTop }) => {
  const { pending, data } = teachersTop
  return {
    isLoading: pending,
    statistics: data.map(({ id, name, stats }) => ({
      id,
      name,
      credits: stats.credits,
      failed: stats.failed,
      passed: stats.passed
    }))
  }
}

export default connect(mapStateToProps, { getTopTeachers })(TeacherLeaderBoard)
