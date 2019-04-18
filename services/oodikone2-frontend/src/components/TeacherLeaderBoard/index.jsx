import React, { Component } from 'react'
import { Segment, Message } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { func, arrayOf, bool, shape, any, string } from 'prop-types'
import { getTopTeachersCategories } from '../../redux/teachersTopCategories'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import LeaderForm from './LeaderForm'

class TeacherLeaderBoard extends Component {
    state={}

    componentDidMount() {
      this.props.getTopTeachersCategories()
    }

    render() {
      const { statistics, updated, isLoading, yearoptions, categoryoptions } = this.props
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
                  <LeaderForm yearoptions={yearoptions} categoryoptions={categoryoptions} />
                  <Segment>
                    <Message size="tiny" content={`Last updated: ${updated}`} />
                    <TeacherStatisticsTable
                      statistics={statistics}
                      onClickFn={e => this.props.history.push(`/teachers/${e.target.innerText}`)}
                    />
                  </Segment>
                </div>
              )
            }
        </div>
      )
    }
}

TeacherLeaderBoard.propTypes = {
  isLoading: bool.isRequired,
  statistics: arrayOf(shape({})).isRequired,
  yearoptions: arrayOf(shape({})).isRequired,
  history: shape({}).isRequired,
  updated: string.isRequired,
  getTopTeachersCategories: func.isRequired,
  categoryoptions: arrayOf(shape({ key: any, text: string, value: any })).isRequired
}

const mapStateToProps = ({ teachersTop, teachersTopCategories }) => {
  const { data } = teachersTop
  const { pending, data: yearsAndCategories } = teachersTopCategories
  const { years = {}, categories = {} } = yearsAndCategories
  const updated = new Date(data.updated)
  return {
    isLoading: pending,
    statistics: data.stats || [],
    updated: updated.toLocaleDateString('en-GB'),
    yearoptions: Object.values(years)
      .map(({ yearcode, yearname }) => ({
        key: yearcode,
        value: yearcode,
        text: yearname
      })).sort((y1, y2) => y2.value - y1.value),
    categoryoptions: Object.values(categories).map(({ id, name }) => ({
      key: id,
      value: id,
      text: name
    }))
  }
}

export default connect(mapStateToProps, {
  getTopTeachersCategories
})(withRouter(TeacherLeaderBoard))
