import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Card, Button, Divider, Menu } from 'semantic-ui-react'
import { string, func, shape, bool, arrayOf } from 'prop-types'
import ClusterGraph from './ClusterGraph'
import { getOodiLearnCourse } from '../../redux/oodilearnCourse'
import { getOodiLearnCluster } from '../../redux/oodilearnCluster'
import CourseGradeSpiders from './CourseGradeSpiders'

const KEYS = {
  PROFILE: 'profile',
  CLUSTER: 'cluster'
}

class CoursePage extends Component {
    state={
      selected: KEYS.PROFILE
    }

    componentDidMount() {
      const { course, getOodiLearnCourse, getOodiLearnCluster } = this.props
      getOodiLearnCourse(course)
      getOodiLearnCluster(course)
    }

    render() {
      const { selected } = this.state
      const { course, goBack, loading, data, clusterData } = this.props
      const finishedLoading = (!loading && data)
      return (
        <Segment basic>
          <Card
            fluid
            header={course}
          />
          <Menu
            onItemClick={(e, { name: selected }) => this.setState({ selected })}
            items={[{
              icon: 'arrow circle left',
              key: 'back',
              onClick: goBack
            }, {
              key: KEYS.PROFILE,
              name: KEYS.PROFILE,
              active: selected === KEYS.PROFILE,
              content: 'Profiles'
            }, {
              key: KEYS.CLUSTER,
              name: KEYS.CLUSTER,
              active: selected === KEYS.CLUSTER,
              content: 'Clusters'
            }]}
          />
          <Divider />
          <Segment loading={loading}>
            { finishedLoading && selected === KEYS.PROFILE && <CourseGradeSpiders data={data} /> }
            { finishedLoading && selected === KEYS.CLUSTER && <ClusterGraph data={clusterData} /> }
          </Segment>
        </Segment>
      )
    }
}

CoursePage.propTypes = {
  goBack: func.isRequired,
  getOodiLearnCourse: func.isRequired,
  data: shape({}),
  loading: bool.isRequired
}

CoursePage.defaultProps = {
  data: undefined
}

const mapStateToProps = (state) => {
  const { pending: loading, data } = state.oodilearnCourse
  const { pending: clusterLoading, data: clusterData} = state.oodilearnCluster
  return {
    loading,
    clusterLoading,
    data,
    clusterData
  }
}

export default connect(mapStateToProps, {
  getOodiLearnCourse, getOodiLearnCluster
})(CoursePage)
