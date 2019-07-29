import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Button, Message, Table, Segment, Icon, Loader, Label, Grid } from 'semantic-ui-react'
import { getDuplicates, addDuplicate, removeDuplicate } from '../../redux/coursecodeduplicates'

import CourseSearch from '../CourseSearch'
import { getTextIn } from '../../common'
import { findCourses } from '../../redux/courses'
import {
  getMandatoryCourses
} from '../../redux/populationMandatoryCourses'

const { func, shape, string, objectOf, arrayOf, bool } = PropTypes

class CourseCodeMapper extends Component {
  constructor(props) {
    super(props)
    props.getDuplicates(props.studyprogramme)
    props.getMandatoryCourses(props.studyprogramme)
  }

  state = {
    codes: {}
  }

  getName = (name) => {
    const { language } = this.props
    return getTextIn(name, language)
  }

  getTableRows = () => {
    const { courseCodeDuplicates, mandatoryCourses, findCoursesDispatch } = this.props
    const { data } = courseCodeDuplicates
    const find = (query, language) => findCoursesDispatch(query, language)
    const rows = mandatoryCourses.data.map((course) => {
      const maincode = Object.keys(data).find(k => data[k].map(e => e.code).includes(course.code))
      const duplicates = maincode ? _.orderBy(data[maincode].filter(e => e.code !== course.code), ['code'], ['ASC']) : []
      return (
        <Table.Row key={course.code}>
          <Table.Cell>{`${course.code} ${this.getName(course.name)}`}</Table.Cell>
          <Table.Cell>
            <Label.Group>
              {duplicates.map(e => (
                <Label key={e.code}>
                  {`${e.code} ${this.getName(e.name)}`}
                  <Icon style={{ margin: '0 0 0 5px' }} color="red" name="remove circle" title="Remove from group" onClick={this.removeDuplicate(e.code)} />
                </Label>
              ))}
            </Label.Group>
          </Table.Cell>
          <Table.Cell>
            <Grid style={{ minWidth: '350px' }}>
              <Grid.Column width={11}>
                <CourseSearch
                  handleResultSelect={
                    (e, { result }) => this.setState(old => ({ codes: { ...old.codes, [course.code]: result.code } }))
                  }
                  findFunction={find}
                />
              </Grid.Column>
              <Grid.Column width={5}>
                <Button
                  fluid
                  content="Add"
                  onClick={this.addDuplicate(course.code, this.state.codes[course.code])}
                />
              </Grid.Column>
            </Grid>
          </Table.Cell>
        </Table.Row>)
    })
    return rows
  }

  addDuplicate = (code1, code2) => () => {
    this.props.addDuplicate(code1, code2)
  }

  removeDuplicate = code => () => {
    this.props.removeDuplicate(code)
  }

  render() {
    const pending = this.props.courseCodeDuplicates.pending || this.props.mandatoryCourses.pending
    const { data } = this.props.mandatoryCourses
    return (
      <div className="segmentContainer">
        <Segment className="contentSegment">
          <Message
            header="Map mandatory courses to alternative courses"
            content="By default courses with different codes are considered as separate courses.
              If this is not the case use this to combine old and new course codes to each other."
          />
          <Loader active={pending} />
          <Table striped celled className="fixed-header">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Mandatory course</Table.HeaderCell>
                <Table.HeaderCell>Alternative courses</Table.HeaderCell>
                <Table.HeaderCell>Add alternative</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {this.getTableRows()}
            </Table.Body>
          </Table>
          {data.length === 0 && <Message info>You need to define mandatory courses first</Message>}
        </Segment>
      </div>
    )
  }
}

CourseCodeMapper.propTypes = {
  language: string.isRequired,
  studyprogramme: string.isRequired,
  findCoursesDispatch: func.isRequired,
  getDuplicates: func.isRequired,
  addDuplicate: func.isRequired,
  removeDuplicate: func.isRequired,
  getMandatoryCourses: func.isRequired,
  mandatoryCourses: shape({}).isRequired,
  courseCodeDuplicates: shape({
    pending: bool,
    error: bool,
    data: objectOf(arrayOf(shape({
      name: shape({
        en: string,
        fi: string,
        sv: string
      }),
      code: string
    })))
  }).isRequired
}

const mapStateToProps = ({ courseCodeDuplicates, populationMandatoryCourses, localize }) => ({
  mandatoryCourses: populationMandatoryCourses,
  courseCodeDuplicates,
  language: getActiveLanguage(localize).code
})

const mapDispatchToProps = dispatch => ({
  getDuplicates: studyprogramme =>
    dispatch(getDuplicates(studyprogramme)),
  addDuplicate: (code1, code2) =>
    dispatch(addDuplicate(code1, code2)),
  removeDuplicate: code =>
    dispatch(removeDuplicate(code)),
  findCoursesDispatch: (query, language) =>
    dispatch(findCourses(query, language)),
  getMandatoryCourses: studyprogramme =>
    dispatch(getMandatoryCourses(studyprogramme))
})

export default connect(mapStateToProps, mapDispatchToProps)(CourseCodeMapper)
