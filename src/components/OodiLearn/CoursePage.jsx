import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Divider, Menu, Placeholder } from 'semantic-ui-react'
import { func, shape, bool, string, arrayOf } from 'prop-types'
import ClusterGraph from './ClusterGraph'
import { getOodiLearnCourse } from '../../redux/oodilearnCourse'
import { getOodiLearnCluster } from '../../redux/oodilearnCluster'
import CourseGradeSpiders from './CourseGradeSpiders'

const KEYS = {
  PROFILE: 'profile',
  CLUSTER: 'cluster'
}

const OlPlaceholder = () => (
  <Placeholder>
    <Placeholder.Header>
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
    </Placeholder.Header>
  </Placeholder>
)

class CoursePage extends Component {
    state={
      selected: KEYS.PROFILE
    }

    componentDidMount() {
      const { course } = this.props
      this.props.getOodiLearnCourse(course)
      this.props.getOodiLearnCluster(course)
    }

    render() {
      const { selected } = this.state
      const { course, goBack, loading, data, clusterData } = this.props
      const finishedLoading = (!loading && data)
      return (
        <Segment basic>
          <Menu
            onItemClick={(e, { name }) => this.setState({ selected: name })}
          >
            <Menu.Item icon="arrow circle left" onClick={goBack} />
            <Menu.Item header content={course} />
            <Menu.Item name={KEYS.PROFILE} content="Profiles" active={selected === KEYS.PROFILE} />
            <Menu.Item name={KEYS.CLUSTER} content="Clusters" active={selected === KEYS.CLUSTER} disabled />
          </Menu>
          <Divider />
          <Segment loading={loading}>
            { !finishedLoading && <OlPlaceholder /> }
            { finishedLoading && selected === KEYS.PROFILE && <CourseGradeSpiders /> }
            { finishedLoading && selected === KEYS.CLUSTER && <ClusterGraph data={clusterData} /> }
          </Segment>
        </Segment>
      )
    }
}

CoursePage.propTypes = {
  goBack: func.isRequired,
  getOodiLearnCourse: func.isRequired,
  getOodiLearnCluster: func.isRequired,
  loading: bool.isRequired,
  course: string.isRequired,
  data: shape({}),
  clusterData: arrayOf(shape({}))
}

CoursePage.defaultProps = {
  data: undefined,
  clusterData: undefined
}

const mapStateToProps = (state) => {
  const { pending: loading, data } = state.oodilearnCourse
  const { pending: clusterLoading, data: clusterData } = state.oodilearnCluster
  return {
    loading,
    clusterLoading,
    clusterData,
    data
  }
}

export default connect(mapStateToProps, {
  getOodiLearnCourse, getOodiLearnCluster
})(CoursePage)
