import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Card, Button, Divider } from 'semantic-ui-react'
import { string, func, shape, bool, arrayOf } from 'prop-types'
import ClusterGraph from './ClusterGraph'
import { getOodiLearnCourse } from '../../redux/oodilearnCourse'
import { getOodiLearnCluster } from '../../redux/oodilearnCluster'
import CourseGradeSpiders from './CourseGradeSpiders'

class CourseInfo extends Component {
    state={}

    componentDidMount() {
      console.log(this.props)
      const { course, getOodiLearnCourse, getOodiLearnCluster } = this.props
      getOodiLearnCourse(course)
      getOodiLearnCluster(course)
    }

    render() {
      const { course, goBack, loading, data, clusterData } = this.props
      return (
        <Segment basic>
          <Button
            icon="arrow circle left"
            basic
            content="Back"
            size="small"
            onClick={goBack}
          />
          <Divider />
          <Card
            fluid
            header={course}
          />
          <Segment loading={loading}>
            { !!data && <CourseGradeSpiders data={data} /> }
            { !!clusterData && <ClusterGraph data={clusterData} /> }
          </Segment>
        </Segment>
      )
    }
}

CourseInfo.propTypes = {
  goBack: func.isRequired,
  getOodiLearnCourse: func.isRequired,
  data: shape({}),
  loading: bool.isRequired
}

CourseInfo.defaultProps = {
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
})(CourseInfo)
