import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Header, Button, Message, Table, Input, Segment, Icon, Loader } from 'semantic-ui-react'
import { getDuplicates, addDuplicate, removeDuplicate } from '../../redux/coursecodeduplicates'

import CourseSearch from '../CourseSearch'
import sharedStyles from '../../styles/shared'
import styles from './courseCodeMapper.css'

const { func, shape, string } = PropTypes

class CourseCodeMapper extends Component {
  constructor(props) {
    super(props)
    props.getDuplicates()
  }

  state = {
    codeFilter: '',
    nameFilter: '',
    code1: '',
    code2: ''
  }

  getName = (name) => {
    const { language } = this.props

    const res = name[language] ? name[language] : name.fi
    return res
  }

  getTableRows = () => {
    const { courseCodeDuplicates, language } = this.props
    const { data } = courseCodeDuplicates
    const filteredKeys = this.filterNames(data, this.filterCodes(data))
    const rows = filteredKeys.map((key) => {
      const course = courseCodeDuplicates.data[key]
      return (
        <Table.Row key={key + Object.keys(course.alt).map(altkey => altkey + course.alt[key])}>
          <Table.Cell>{key}</Table.Cell>
          <Table.Cell>{this.getName(course.name)}</Table.Cell>
          <Table.Cell>{course.main}</Table.Cell>
          <Table.Cell>{Object.keys(course.alt).map(altkey => (
            <React.Fragment key={course.alt[altkey] + altkey}>
              {altkey}
              <Icon color="red" name="remove circle" onClick={this.removeDuplicate(key, altkey)} />
            </React.Fragment>))}
          </Table.Cell>
          <Table.Cell>
            {Object.keys(course.alt).map(altKey => course.alt[altKey][language]).toString()}
          </Table.Cell>
        </Table.Row>)
    })
    return rows
  }

  filterNames = (duplicates, keys) => {
    const filter = this.state.nameFilter.toLocaleLowerCase()
    return keys.filter((key) => {
      const course = duplicates[key]
      return (
        this.getName(course.name).toLocaleLowerCase().includes(filter) ||
        Object.values(course.alt).find(name =>
          this.getName(name).toLocaleLowerCase().includes(filter))
      )
    })
  }

  filterCodes = (duplicates) => {
    const filter = this.state.codeFilter.toLocaleLowerCase()
    const keys = Object.keys(duplicates)
    return keys.filter((key) => {
      const course = duplicates[key]
      return (
        key.toLocaleLowerCase().includes(filter) ||
        Object.keys(course.alt).find(code =>
          code.toLocaleLowerCase().includes(filter))
      )
    })
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

  removeDuplicate = (code1, code2) => () => {
    this.props.removeDuplicate(code1, code2)
  }

  render() {
    const { pending } = this.props.courseCodeDuplicates
    const disabled = !((this.state.code1 && this.state.code2) &&
      (this.state.code1 !== this.state.code2))
    return (
      <div className={sharedStyles.segmentContainer}>
        <Segment className={sharedStyles.contentSegment}>
          <Header className={sharedStyles.segmentTitle} size="large">Course Code Mapping</Header>
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
                <CourseSearch handleResultSelect={this.handleResultSelect1} />
                <CourseSearch handleResultSelect={this.handleResultSelect2} />
                <Button
                  disabled={disabled}
                  className={styles.button}
                  content="Add"
                  onClick={this.addDuplicate(this.state.code1, this.state.code2)}
                />
              </Segment>
            </Segment.Group>
          </Segment.Group>
          <Table striped>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Code</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Main code</Table.HeaderCell>
                <Table.HeaderCell>Alternative code(s)</Table.HeaderCell>
                <Table.HeaderCell>Alternative name(s)</Table.HeaderCell>
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
  getDuplicates: func.isRequired,
  addDuplicate: func.isRequired,
  removeDuplicate: func.isRequired,
  courseCodeDuplicates: shape({}).isRequired
}

const mapStateToProps = ({ courseCodeDuplicates, settings }) => ({
  courseCodeDuplicates,
  language: settings.language
})

const mapDispatchToProps = dispatch => ({
  getDuplicates: () =>
    dispatch(getDuplicates()),
  addDuplicate: (code1, code2) =>
    dispatch(addDuplicate(code1, code2)),
  removeDuplicate: (code1, code2) =>
    dispatch(removeDuplicate(code1, code2))
})

export default connect(mapStateToProps, mapDispatchToProps)(CourseCodeMapper)
