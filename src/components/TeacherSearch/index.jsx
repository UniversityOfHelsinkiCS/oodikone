import React, { Component } from 'react'
import { Search, Segment, Message } from 'semantic-ui-react'
import { func, arrayOf, object, shape } from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import styles from './teacherSearch.css'
import sharedStyles from '../../styles/shared'
import Timeout from '../Timeout'
import { findTeachers } from '../../redux/teachers'
import SearchResultTable from '../SearchResultTable'

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
                <SearchResultTable
                  headers={['Teacher ID', 'Username', 'Name']}
                  rows={this.props.teachers}
                  rowClickFn={(_, teacher) => this.props.history.push(`/teachers/${teacher.id}`)}
                  noResultText="No teachers matched your search"
                />
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
