import React, { Component } from 'react'
import { Header, Segment, Tab } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { bool } from 'prop-types'
import style from './courseStatistics.css'
import sharedStyles from '../../styles/shared'
import SearchForm from './SearchForm'
import SingleCourseTab from './SingleCourseTab'
import SummaryTab from './SummaryTab'

const SearchResults = () => (
  <Tab
    menu={{ attached: false }}
    panes={[
      {
        menuItem: 'Summary',
        render: () => <SummaryTab />
      },
      {
        menuItem: 'Course',
        render: () => <SingleCourseTab />
      }
    ]}
  />
)

class CourseStatistics extends Component {
  state={}
  render() {
    const { statsIsEmpty } = this.props
    return (
      <div className={style.container}>
        <Header className={sharedStyles.segmentTitle} size="large">
          Course Statistics
        </Header>
        <Segment className={sharedStyles.contentSegment} >
          <SearchForm />
          {!statsIsEmpty && <SearchResults />}
        </Segment>
      </div>
    )
  }
}

CourseStatistics.propTypes = {
  statsIsEmpty: bool.isRequired
}

const mapStateToProps = ({ courseStats }) => ({
  statsIsEmpty: Object.keys(courseStats.data).length === 0
})

export default connect(mapStateToProps)(CourseStatistics)
