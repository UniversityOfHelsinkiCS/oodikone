import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Message } from 'semantic-ui-react'
import { func, bool } from 'prop-types'
import AutoSubmitSearchInput from '../AutoSubmitSearchInput'
import { getStudentData } from '../../redux/oodilearnStudent'
import StudentResult from './StudentResult'

const MIN_SEARCH_LENGTH = 5

class StudentSearch extends Component {
    state={
      searchterm: ''
    }

    render() {
      const { error, loading, hasData } = this.props
      const { searchterm } = this.state
      const failedQuery = (!loading && (searchterm.length >= MIN_SEARCH_LENGTH) && error)
      const showResult = (searchterm.length >= MIN_SEARCH_LENGTH)
        && !loading && !failedQuery && hasData
      const searchTooShort = (searchterm.length > 0 && searchterm.length < MIN_SEARCH_LENGTH)
      return (
        <Segment basic>
          <AutoSubmitSearchInput
            placeholder="Search for learner profiles by name or student number..."
            doSearch={this.props.getStudentData}
            value={searchterm}
            onChange={val => this.setState({ searchterm: val })}
            loading={this.props.loading}
            minSearchLength={MIN_SEARCH_LENGTH}
          />
          { searchTooShort && <Message content="Search term length must be at least 5 characters." /> }
          { failedQuery && <Message error content="No results matched query." /> }
          { showResult && <StudentResult onSelectStudent={this.props.onSelectStudent} /> }
        </Segment>
      )
    }
}

StudentSearch.propTypes = {
  getStudentData: func.isRequired,
  loading: bool.isRequired,
  error: bool.isRequired,
  hasData: bool.isRequired,
  onSelectStudent: func.isRequired
}

const mapStateToProps = ({ oodilearnStudent }) => ({
  loading: oodilearnStudent.pending,
  error: oodilearnStudent.error,
  hasData: !!oodilearnStudent.data,
  data: oodilearnStudent.data
})

export default connect(mapStateToProps, {
  getStudentData
})(StudentSearch)
