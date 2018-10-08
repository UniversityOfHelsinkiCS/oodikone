import React, { Component } from 'react'
import { Header, Segment, Tab } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { bool } from 'prop-types'
import style from './courseStatistics.css'
import sharedStyles from '../../styles/shared'
import SearchForm from './SearchForm'
import SingleCourseTab from './SingleCourseTab'
import SummaryTab from './SummaryTab'
import { clearCourseStats } from '../../redux/coursestats'

class CourseStatistics extends Component {
  static getDerivedStateFromProps(props, state) {
    const finishedGet = !props.pending && state.pending && !props.error
    return {
      pending: props.pending,
      activeIndex: finishedGet ? 0 : state.activeIndex
    }
  }

  state={
    activeIndex: 0
  }

  handleTabChange = (e, { activeIndex }) => {
    this.setState({ activeIndex })
  }

  render() {
    const { statsIsEmpty } = this.props
    return (
      <div className={style.container}>
        <Header className={sharedStyles.segmentTitle} size="large">
          Course Statistics
        </Header>
        <Segment className={sharedStyles.contentSegment} >
          { statsIsEmpty ? <SearchForm /> : (
            <Tab
              menu={{ attached: false, borderless: false }}
              panes={[
                {
                  menuItem: 'Summary',
                  render: () => <SummaryTab />
                },
                {
                  menuItem: 'Course',
                  render: () => <SingleCourseTab />
                },
                {
                  menuItem: {
                    key: 'query',
                    content: 'New query',
                    icon: 'search',
                    position: 'right'
                  },
                  render: () => <SearchForm />
                }
              ]}
              activeIndex={this.state.activeIndex}
              onTabChange={this.handleTabChange}
            />
          )}
        </Segment>
      </div>
    )
  }
}

CourseStatistics.propTypes = {
  statsIsEmpty: bool.isRequired
}

const mapStateToProps = ({ courseStats }) => ({
  pending: courseStats.pending,
  error: courseStats.error,
  statsIsEmpty: Object.keys(courseStats.data).length === 0
})

export default connect(mapStateToProps, { clearCourseStats })(CourseStatistics)
