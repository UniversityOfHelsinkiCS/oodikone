import React, { Component } from 'react'
import { Message } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { arrayOf, shape, string } from 'prop-types'
import ProfileSpiderGraph from './ProfileSpiderGraph'

class SearchResult extends Component {
    state={}

    render() {
      const { profiles } = this.props
      if (profiles.length === 0) {
        return (<Message content="No results matched query" />)
      }
      return (
        <div>
          { profiles.map(s => <ProfileSpiderGraph key={s.studentnumber} profile={s.profile} />)}
        </div>
      )
    }
}

SearchResult.propTypes = {
  profiles: arrayOf(shape({
    studentnumber: string,
    profile: shape({})
  })).isRequired
}

const mapStateToProps = ({ oodilearnStudent }) => ({
  profiles: oodilearnStudent.data
})

export default connect(mapStateToProps)(SearchResult)
