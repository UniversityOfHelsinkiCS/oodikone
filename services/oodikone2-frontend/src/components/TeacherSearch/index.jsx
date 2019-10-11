import React, { Component } from 'react'
import { Search, Segment, Icon } from 'semantic-ui-react'
import { func, arrayOf, object, string } from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import './teacherSearch.css'
import { validateInputLength, splitByEmptySpace } from '../../common/index'
import Timeout from '../Timeout'
import { findTeachers } from '../../redux/teachers'
import SortableTable from '../SortableTable'

const DEFAULT_STATE = {
  searchterm: '',
  displayResults: false
}

class TeacherSearch extends Component {
  state = DEFAULT_STATE

  resetComponent = () => {
    this.setState(DEFAULT_STATE)
  }

  fetchTeachers = searchterm => {
    const trimmedSearchterm = searchterm.trim()
    if (
      !splitByEmptySpace(trimmedSearchterm).find(t => validateInputLength(t, 4)) ||
      (Number(trimmedSearchterm) && trimmedSearchterm.length < 6)
    ) {
      return
    }
    this.props.setTimeout('fetch', () => {}, 250)
    this.props.findTeachers(trimmedSearchterm).then(() => {
      this.setState({ displayResults: true })
      this.props.clearTimeout('fetch')
    })
  }

  handleSearchChange = (e, { value }) => {
    this.props.clearTimeout('search')
    if (value.length > 0) {
      this.setState({ searchterm: value })
      this.props.setTimeout(
        'search',
        () => {
          this.fetchTeachers(value)
        },
        250
      )
    } else {
      this.resetComponent()
    }
  }

  render() {
    const columns = [
      { key: 'name', title: 'Name', getRowVal: s => s.name, headerProps: { onClick: null, sorted: null, colSpan: 2 } },
      {
        key: 'icon',
        getRowVal: () => <Icon name={this.props.icon} />,
        cellProps: { collapsing: true },
        headerProps: { onClick: null, sorted: null }
      }
    ]

    return (
      <div>
        <div className="searchContainer">
          <Search
            className="searchInput"
            input={{ fluid: true }}
            placeholder="Search by entering a username, id or name"
            value={this.state.searchterm}
            onSearchChange={this.handleSearchChange}
            showNoResults={false}
          />
          {this.state.displayResults && (
            <Segment className="contentSegment">
              {this.props.teachers.length <= 0 ? (
                <div>No teachers matched your search</div>
              ) : (
                <SortableTable
                  getRowKey={s => s.id}
                  getRowProps={teacher => ({
                    className: 'clickable',
                    onClick: () => this.props.onClick(teacher)
                  })}
                  tableProps={{ celled: false, sortable: false }}
                  columns={columns}
                  data={this.props.teachers}
                />
              )}
            </Segment>
          )}
        </div>
      </div>
    )
  }
}

TeacherSearch.propTypes = {
  setTimeout: func.isRequired,
  clearTimeout: func.isRequired,
  teachers: arrayOf(object).isRequired,
  findTeachers: func.isRequired,
  onClick: func.isRequired,
  icon: string.isRequired
}

const mapStateToProps = ({ teachers }) => {
  const { list } = teachers
  return {
    teachers: list
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    { findTeachers }
  )(Timeout(TeacherSearch))
)
