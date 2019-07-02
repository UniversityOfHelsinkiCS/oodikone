import React, { Component, Fragment } from 'react'
import { Header, Search, Segment, Icon } from 'semantic-ui-react'
import { func, arrayOf, object, string } from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import './courseGroupAddTeacher.css'

import Timeout from '../../Timeout'
import { findTeachers } from '../../../redux/teachers'
import { callApi } from '../../../apiConnection'
import SortableTable from '../../SortableTable'

const DEFAULT_STATE = {
  courseGroup: undefined,
  isLoading: true,
  searchterm: '',
  displayResults: false
}

class CourseGroupAddTeacher extends Component {
  state = DEFAULT_STATE

  componentDidMount() {
    callApi(`/course-groups/${this.props.groupId}`)
      .then((res) => {
        this.setState({
          courseGroup: res.data,
          isLoading: false
        })
      })
  }

  resetComponent = () => {
    this.setState(DEFAULT_STATE)
  }

  fetchTeachers = (searchterm) => {
    if (searchterm.length <= 3 || (Number(searchterm) && searchterm.length < 6)) {
      return
    }
    this.props.setTimeout('fetch', () => {
    }, 250)
    this.props.findTeachers(searchterm).then(() => {
      this.setState({ displayResults: true })
      this.props.clearTimeout('fetch')
    })
  }

  handleSearchChange = (e, { value }) => {
    this.props.clearTimeout('search')
    if (value.length > 0) {
      this.setState({ searchterm: value })
      this.props.setTimeout('search', () => {
        this.fetchTeachers(value)
      }, 250)
    } else {
      this.resetComponent()
    }
  }

  render() {
    const { isLoading, courseGroup } = this.state

    const searchResultColumns = [
      { key: 'teacherid', title: 'Teacher ID', getRowVal: s => s.id, headerProps: { onClick: null, sorted: null } },
      { key: 'username', title: 'Username', getRowVal: s => s.code, headerProps: { onClick: null, sorted: null } },
      { key: 'name', title: 'Name', getRowVal: s => s.name, headerProps: { onClick: null, sorted: null, colSpan: 2 } },
      { key: 'icon', getRowVal: () => (<Icon name="add user" />), cellProps: { collapsing: true }, headerProps: { onClick: null, sorted: null } }
    ]

    const groupColumns = [
      { key: 'Teacher ID', title: 'Teacher ID', getRowVal: t => t.id },
      { key: 'Username', title: 'Username', getRowVal: t => t.code },
      { key: 'Name', title: 'Name', getRowVal: t => t.name },
      {
        key: 'Remove',
        title: 'Remove',
        getRowVal: () => '',
        getCellProps: t => ({
          collapsing: true,
          icon: <Icon
            name="remove user"
            link
            onClick={
              () => {
                this.setState({ isLoading: true })
                callApi(`/course-groups/${this.props.groupId}/remove/${t.id}`, 'post')
                  .then(() => {
                    callApi(`/course-groups/${this.props.groupId}`)
                    .then((res) => {
                      this.setState({
                        courseGroup: res.data,
                        isLoading: false
                      })
                    })
                  })
              }
            }
          />,
          textAlign: 'center'
        }),
        headerProps: { onClick: null, sorted: null }
      }
    ]

    return (
      <Segment loading={isLoading}>
        {!courseGroup ? null : (
          <Fragment>
            <Header size="large">
              {courseGroup.name}
            </Header>
            <Segment>
              <Header size="medium">Add teacher</Header>
              <Search
                input={{ fluid: true }}
                placeholder="Search by entering a username, id or name"
                value={this.state.searchterm}
                onSearchChange={this.handleSearchChange}
                showNoResults={false}
              />
              { this.state.displayResults && (
                <Fragment>
                  {this.props.teachers.length <= 0 ? <div>No teachers matched your search</div> :
                  <SortableTable
                    getRowKey={s => s.id}
                    getRowProps={teacher => ({
                      className: 'clickable',
                      onClick: () => {
                        this.setState({ isLoading: true })
                        callApi(`/course-groups/${this.props.groupId}/add/${teacher.id}`, 'post')
                          .then(() => {
                            callApi(`/course-groups/${this.props.groupId}`)
                            .then((res) => {
                              this.setState({
                                courseGroup: res.data,
                                isLoading: false
                              })
                            })
                          })
                      }
                    })}
                    tableProps={{ celled: false, sortable: false }}
                    columns={searchResultColumns}
                    data={this.props.teachers}
                  />}
                </Fragment>
              )}
            </Segment>
            <Segment>
              <Header size="medium">Teachers in group</Header>
              <SortableTable
                getRowKey={gc => gc.id}
                columns={groupColumns}
                data={courseGroup.teachers}
              />
            </Segment>
          </Fragment>
        )}
      </Segment>
    )
  }
}

CourseGroupAddTeacher.propTypes = {
  groupId: string.isRequired,
  setTimeout: func.isRequired,
  clearTimeout: func.isRequired,
  teachers: arrayOf(object).isRequired,
  findTeachers: func.isRequired
}

const mapStateToProps = ({ teachers }) => {
  const { list } = teachers
  return {
    teachers: list
  }
}

export default withRouter(connect(mapStateToProps, { findTeachers })(Timeout(CourseGroupAddTeacher)))
