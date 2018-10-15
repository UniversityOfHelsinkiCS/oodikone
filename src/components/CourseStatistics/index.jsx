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

const MENU = {
  SUM: 'Summary',
  COURSE: 'Course',
  QUERY: 'New query'
}

class CourseStatistics extends Component {
  static getDerivedStateFromProps(props, state) {
    const finishedGet = !props.pending && state.pending && !props.error
    return {
      pending: props.pending,
      activeIndex: finishedGet ? 0 : state.activeIndex
    }
  }

  state={
    activeIndex: 0,
    selected: undefined
  }

  getPanes = () => {
    const { singleCourseStats } = this.props
    const panes = [
      {
        menuItem: MENU.SUM,
        render: () => <SummaryTab onClickCourse={this.switchToCourse} />
      },
      {
        menuItem: MENU.COURSE,
        render: () => <SingleCourseTab selected={this.state.selected} />
      },
      {
        menuItem: {
          key: 'query',
          content: MENU.QUERY,
          icon: 'search',
          position: 'right'
        },
        render: () => <SearchForm />
      }
    ]
    return !singleCourseStats ? panes : panes.filter(p => p.menuItem !== MENU.SUM)
  }

  handleTabChange = (e, { activeIndex }) => {
    this.setState({ activeIndex })
  }

  switchToCourse = (coursecode) => {
    this.setState({
      activeIndex: 1,
      selected: coursecode
    })
  }

  render() {
    const { statsIsEmpty } = this.props
    const panes = this.getPanes()
    return (
      <div className={style.container}>
        <Header className={sharedStyles.segmentTitle} size="large">
          Course Statistics
        </Header>
        <Segment className={sharedStyles.contentSegment} >
          { statsIsEmpty ? <SearchForm /> : (
            <Tab
              menu={{ attached: false, borderless: false }}
              panes={panes}
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
  statsIsEmpty: bool.isRequired,
  singleCourseStats: bool.isRequired
}

const mapStateToProps = ({ courseStats }) => {
  const courses = Object.keys(courseStats.data)
  return {
    pending: courseStats.pending,
    error: courseStats.error,
    statsIsEmpty: courses.length === 0,
    singleCourseStats: courses.length === 1
  }
}

export default connect(mapStateToProps, { clearCourseStats })(CourseStatistics)
