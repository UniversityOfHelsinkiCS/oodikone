import React, { Component } from 'react'
import { Segment, Message, Button, Popup } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { func, arrayOf, bool, shape, any, string } from 'prop-types'
import { getTopTeachersCategories } from '../../redux/teachersTopCategories'
import { getTopTeachers } from '../../redux/teachersTop'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import LeaderForm from './LeaderForm'
import { callApi } from '../../apiConnection'

class TeacherLeaderBoard extends Component {
  state = {
    selectedyear: null,
    selectedcategory: null,
    recalculating: false,
    isOpen: false
  }

  componentDidMount() {
    this.props.getTopTeachersCategories()
  }

  handleOpen = () => {
    this.setState({ isOpen: true, recalculating: true })

    this.timeout = setTimeout(() => {
      this.setState({ isOpen: false })
    }, 5000)
  }

  handleClose = () => {
    this.setState({ isOpen: false })
    clearTimeout(this.timeout)
  }

  refresh = () => {
    const { selectedyear } = this.state
    callApi('/teachers/top', 'post', { startyearcode: selectedyear, endyearcode: selectedyear + 1 }, null)
  }

  updateAndSubmitForm = (args) => {
    this.setState({ recalculating: false, ...args })
    const { selectedyear, selectedcategory } = { ...this.state, ...args }
    this.props.getTopTeachers(selectedyear, selectedcategory)
  }

  handleChange = (e, { value, name }) => this.updateAndSubmitForm({ [name]: value })

  render() {
    const { statistics, updated, isLoading, yearoptions, categoryoptions } = this.props
    const { selectedcategory, selectedyear, recalculating } = this.state
    return (
      <div>
        {isLoading
          ? <Segment basic loading={isLoading} />
          : (
            <div>
              <Message>
                <Message.Header>Teacher leaderboard</Message.Header>
                Teachers who have produced the most credits from all departments.
              </Message>
              <LeaderForm
                yearoptions={yearoptions}
                categoryoptions={categoryoptions}
                handleChange={this.handleChange}
                updateAndSubmitForm={this.updateAndSubmitForm}
                selectedcategory={selectedcategory}
                selectedyear={selectedyear}
              />
              <Segment>
                <Message>
                  {`Last updated: ${updated}`}
                </Message>
                <Popup
                  trigger={
                    <Button
                      disabled={recalculating}
                      content="Recalculate this year"
                      onClick={() => { this.refresh() }}
                    />}
                  content="Recalculation started. Recalculation might take multiple minutes. Refresh page to see the results"
                  on="click"
                  open={this.state.isOpen}
                  onClose={this.handleClose}
                  onOpen={this.handleOpen}
                />

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
  getTopTeachers: func.isRequired,
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
  getTopTeachersCategories,
  getTopTeachers
})(withRouter(TeacherLeaderBoard))
