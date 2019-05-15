import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { connect } from 'react-redux'
import { Header, Button, Message, Table, Input, Segment, Icon, Loader, Label } from 'semantic-ui-react'
import { getDuplicates, addDuplicate, removeDuplicate } from '../../redux/coursecodeduplicates'

import CourseSearch from '../CourseSearch'
import { getTextIn } from '../../common'
import { findCourses } from '../../redux/courses'

const { func, shape, string, objectOf, arrayOf, bool } = PropTypes

class CourseCodeMapper extends Component {
  constructor(props) {
    super(props)
    props.getDuplicates(props.studyprogramme)
  }

  state = {
    codeFilter: '',
    nameFilter: '',
    code1: '',
    code2: ''
  }

  getName = (name) => {
    const { language } = this.props
    return getTextIn(name, language)
  }

  getTableRows = () => {
    const { courseCodeDuplicates } = this.props
    const { codeFilter, nameFilter } = this.state
    const { data } = courseCodeDuplicates
    const filteredKeys = Object.keys(data)
      .filter(k => data[k].some(e => e.code.toLocaleLowerCase().includes(codeFilter.toLocaleLowerCase())))
      .filter(k => data[k].some(e => this.getName(e.name).toLocaleLowerCase().includes(nameFilter.toLocaleLowerCase())))
    const rows = filteredKeys.map((key) => {
      const duplicates = _.sortBy(courseCodeDuplicates.data[key], ['code'])
      const maincourse = duplicates.find(e => e.code === key)
      return (
        <Table.Row key={key}>
          <Table.Cell>{`${key} ${this.getName(maincourse.name)}`}</Table.Cell>
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
        </Table.Row>)
    })
    return rows
  }

  handleCodeFilterChange = (e) => {
    this.setState({ codeFilter: e.target.value })
  }

  handleNameFilterChange = (e) => {
    this.setState({ nameFilter: e.target.value })
  }

  handleResultSelect1 = (e, { result }) => {
    this.setState({ code1: result.code })
  }

  handleResultSelect2 = (e, { result }) => {
    this.setState({ code2: result.code })
  }

  addDuplicate = (code1, code2) => () => {
    this.props.addDuplicate(code1, code2)
  }

  removeDuplicate = code => () => {
    this.props.removeDuplicate(code)
  }

  render() {
    const { findCoursesDispatch } = this.props
    const { pending } = this.props.courseCodeDuplicates
    const disabled = !((this.state.code1 && this.state.code2) &&
      (this.state.code1 !== this.state.code2))
    const find = (query, language) => findCoursesDispatch(query, language)
    return (
      <div className="segmentContainer">
        <Segment className="contentSegment">
          <Message
            header="Map corresponding course codes to each other"
            content="By default courses with different codes are considered as separate courses.
              If this is not the case use this to combine old and new course codes to each other."
          />
          <Loader active={pending} />
          <Segment.Group>
            <Segment.Group horizontal>
              <Segment>
                <Header content="Filter course codes" />
                <Input
                  fluid
                  placeholder="By Code"
                  onChange={this.handleCodeFilterChange}
                />
                <Input
                  fluid
                  placeholder="By Name"
                  onChange={this.handleNameFilterChange}
                />
              </Segment>
              <Segment>
                <Header>Add new corresponding code</Header>
                <CourseSearch handleResultSelect={this.handleResultSelect1} findFunction={find} />
                <CourseSearch handleResultSelect={this.handleResultSelect2} findFunction={find} />
                <Button
                  disabled={disabled}
                  className="button"
                  content="Add"
                  onClick={this.addDuplicate(this.state.code1, this.state.code2)}
                />
              </Segment>
            </Segment.Group>
          </Segment.Group>
          <Table striped celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Main course</Table.HeaderCell>
                <Table.HeaderCell>Grouped courses</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {this.getTableRows()}
            </Table.Body>
          </Table>
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

const mapStateToProps = ({ courseCodeDuplicates, settings }) => ({
  courseCodeDuplicates,
  language: settings.language
})

const mapDispatchToProps = dispatch => ({
  getDuplicates: studyprogramme =>
    dispatch(getDuplicates(studyprogramme)),
  addDuplicate: (code1, code2) =>
    dispatch(addDuplicate(code1, code2)),
  removeDuplicate: code =>
    dispatch(removeDuplicate(code)),
  findCoursesDispatch: (query, language) =>
    dispatch(findCourses(query, language))
})

export default connect(mapStateToProps, mapDispatchToProps)(CourseCodeMapper)
