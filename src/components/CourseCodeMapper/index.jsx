import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Header, Button, Message, Table, Input } from 'semantic-ui-react'
import { getDuplicates, addDuplicate } from '../../redux/coursecodeduplicates'

import sharedStyles from '../../styles/shared'

const { func, obj } = PropTypes


class CourseCodeMapper extends Component {
  componentWillMount = () => {
    this.props.getDuplicates()
  }

  getTableRows = () => {
    const { courseCodeDuplicates } = this.props
    const keys = Object.keys(courseCodeDuplicates.data)
    const rows = keys.map(key => (
      <Table.Row>
        <Table.Cell>{key}</Table.Cell>
        <Table.Cell>Oh no</Table.Cell>
        <Table.Cell>{courseCodeDuplicates.data[key].toString()}</Table.Cell>
        <Table.Cell>No</Table.Cell>
      </Table.Row>))
    return rows
  }

  addDuplicate = (code1, code2) => {
    this.props.addDuplicate(code1, code2)
  }

  render() {
    return (
      <div className={sharedStyles.segmentContainer}>
        <Header className={sharedStyles.segmentTitle} size="large">Course Code Mapping</Header>
        <Message
          header="Map corresponding course codes to each other"
          content="By default courses with different codes are considered as separate courses.
            If this is not the case use this to combine old and new course codes to each other."
        />
        <Button content="Show all mapped course codes" />
        <Input
          placeholder="Filter"
          onChange={this.handlefilterchange}
        />
        <Table striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Code</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Alternative code(s)</Table.HeaderCell>
              <Table.HeaderCell>Alternative name(s)</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.getTableRows()}
          </Table.Body>
        </Table>
      </div>
    )
  }
}

CourseCodeMapper.propTypes = {
  getDuplicates: func.isRequired,
  addDuplicate: func.isRequired,
  courseCodeDuplicates: obj.isRequired
}

const mapStateToProps = ({ courseCodeDuplicates }) => ({
  courseCodeDuplicates
})

const mapDispatchToProps = dispatch => ({
  getDuplicates: () =>
    dispatch(getDuplicates()),
  addDuplicate: (code1, code2) =>
    dispatch(addDuplicate(code1, code2))
})

export default connect(mapStateToProps, mapDispatchToProps)(CourseCodeMapper)
