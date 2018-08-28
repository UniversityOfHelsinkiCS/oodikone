import React, { Component } from 'react'
import { Segment, Message } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, arrayOf, bool, shape } from 'prop-types'
import { getSemesters } from '../../redux/semesters'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import LeaderForm from './LeaderForm'

class TeacherLeaderBoard extends Component {
    state={}

    componentDidMount() {
      this.props.getSemesters()
    }

    render() {
      const { statistics, isLoading, yearoptions } = this.props
      return (
        <div>
          { isLoading
              ? <Segment basic loading={isLoading} />
              : (
                <div>
                  <Message
                    header="Teacher leaderboard"
                    content="Teachers who have produced the most credits from all departments."
                  />
                  <LeaderForm yearoptions={yearoptions} />
                  <Segment>
                    <TeacherStatisticsTable statistics={statistics} />
                  </Segment>
                </div>
              )
            }
        </div>
      )
    }
}

TeacherLeaderBoard.propTypes = {
  getSemesters: func.isRequired,
  isLoading: bool.isRequired,
  statistics: arrayOf(shape({})).isRequired,
  yearoptions: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ teachersTop, semesters }) => {
  const { data } = teachersTop
  const { pending } = semesters
  const years = semesters.data.years || {}
  return {
    isLoading: pending,
    statistics: data.map(({ id, name, stats }) => ({
      id,
      name,
      credits: stats.credits,
      failed: stats.failed,
      passed: stats.passed
    })),
    yearoptions: Object.values(years)
      .map(({ yearcode, yearname }) => ({
        key: yearcode,
        value: yearcode,
        text: yearname
      })).sort((y1, y2) => y2.value - y1.value)
  }
}

export default connect(mapStateToProps, { getSemesters })(TeacherLeaderBoard)
