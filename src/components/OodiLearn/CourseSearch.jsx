import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment } from 'semantic-ui-react'
import { func, arrayOf, shape } from 'prop-types'
import AutoSubmitSearchInput from '../AutoSubmitSearchInput'
import { getCourses } from '../../redux/oodilearnCourses'
import oodilearnSelector from '../../selectors/oodilearn'
import ResultTable from './ResultTable'

const MIN_SEARCH_LENGTH = 5

class StudentSearch extends Component {
    state={
      searchterm: ''
    }

    componentDidMount() {
      this.props.getCourses()
    }

    render() {
      const { courses } = this.props
      const { searchterm } = this.state
      return (
        <Segment basic>
          <AutoSubmitSearchInput
            placeholder="Search for courses by name or code..."
            doSearch={() => {}}
            value={searchterm}
            onChange={val => this.setState({ searchterm: val })}
            loading={false}
            minSearchLength={MIN_SEARCH_LENGTH}
            disabled
          />
          <ResultTable
            results={courses.map(({ code: id, name }) => ({
              id,
              name,
              handleClick: () => this.props.onClickResult(id)
              }))
            }
          />
        </Segment>
      )
    }
}

StudentSearch.propTypes = {
  getCourses: func.isRequired,
  courses: arrayOf(shape({})).isRequired,
  onClickResult: func.isRequired
}

const mapStateToProps = state => ({
  courses: oodilearnSelector.getSearchedCourses(state)
})

export default connect(mapStateToProps, {
  getCourses
})(StudentSearch)
