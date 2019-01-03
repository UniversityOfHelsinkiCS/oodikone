import React, { Component } from 'react'
import { Search, Segment, Message, Icon } from 'semantic-ui-react'
import { func, arrayOf, object, shape } from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import styles from './teacherSearch.css'
import sharedStyles from '../../styles/shared'
import Timeout from '../Timeout'
import { findTeachers } from '../../redux/teachers'
import SortableTable from '../CourseStatistics/SortableTable'

const DEFAULT_STATE = {
  searchterm: '',
  displayResults: false
}

class TeacherSearch extends Component {
    state=DEFAULT_STATE

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
      const columns = [
        { key: 'teacherid', title: 'Teacher ID', getRowVal: s => s.id, headerProps: { onClick: null, sorted: null } },
        { key: 'username', title: 'Username', getRowVal: s => s.code, headerProps: { onClick: null, sorted: null } },
        { key: 'name', title: 'Name', getRowVal: s => s.name, headerProps: { onClick: null, sorted: null } },
        { key: 'icon', title: '', getRowVal: () => (<Icon name="level up alternate" />), cellProps: { collapsing: true }, headerProps: { onClick: null, sorted: null } }
      ]

      return (
        <div >
          <Message
            header="Teacher search"
            content="Search for a teacher and click the search result to view their individual statistics from their entire career. "
          />
          <div className={styles.searchContainer}>
            <Search
              className={styles.searchInput}
              input={{ fluid: true }}
              placeholder="Search by entering a username, id or name"
              value={this.state.searchterm}
              onSearchChange={this.handleSearchChange}
              showNoResults={false}
            />
            { this.state.displayResults && (
              <Segment className={sharedStyles.contentSegment}>
                {this.props.teachers.length <= 0 ? <div>No teachers matched your search</div> :
                <SortableTable
                  getRowKey={s => s.id}
                  getRowProps={teacher => ({
                    className: styles.clickable,
                    onClick: () => this.props.history.push(`/teachers/${teacher.id}`)
                  })}
                  tableProps={{ celled: false, singleLine: true, sortable: false }}
                  columns={columns}
                  data={this.props.teachers}
                />}
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
  history: shape({}).isRequired
}

const mapStateToProps = ({ teachers }) => {
  const { list } = teachers
  return {
    teachers: list
  }
}

export default withRouter(connect(mapStateToProps, { findTeachers })(Timeout(TeacherSearch)))
