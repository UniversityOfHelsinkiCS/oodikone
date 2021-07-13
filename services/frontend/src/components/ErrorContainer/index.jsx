import React from 'react'
import { connect } from 'react-redux'
import { arrayOf, object } from 'prop-types'

import ErrorMessage from '../ErrorMessage'

const ErrorContainer = props => {
  if (!props.errors) return null
  const errors = props.errors.map((error, index) => (
    <ErrorMessage
      // eslint-disable-next-line react/no-array-index-key
      key={index}
      code={error.code}
      message={error.error}
      url={error.url}
      uuid={error.uuid}
    />
  ))
  return <div className="segmentContainer">{errors}</div>
}

const mapStateToProps = ({ errors }) => ({
  errors: errors.length ? errors : []
})

ErrorContainer.defaultProps = {
  errors: []
}

ErrorContainer.propTypes = {
  errors: arrayOf(object)
}

export default connect(mapStateToProps)(ErrorContainer)
