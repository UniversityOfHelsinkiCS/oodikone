import React from 'react'
import { connect } from 'react-redux'
import { arrayOf, func, object } from 'prop-types'
import { getTranslate } from 'react-localize-redux'

import ErrorMessage from '../ErrorMessage'

const ErrorContainer = (props) => {
  if (!props.errors) return (null)
  const errors = props.errors.map((error, index) => (
    <ErrorMessage
        // eslint-disable-next-line react/no-array-index-key
      key={index}
      code={error.code}
      message={error.error}
      url={error.url}
      uuid={error.uuid}
      translate={props.translate}
    />
  ))
  return (<div className="segmentContainer">{errors}</div>)
}

const mapStateToProps = ({ errors, locale }) => ({
  errors: errors.length ? errors : [],
  translate: getTranslate(locale)
})

ErrorContainer.defaultProps = {
  errors: []
}

ErrorContainer.propTypes = {
  errors: arrayOf(object),
  translate: func.isRequired
}

export default connect(mapStateToProps)(ErrorContainer)
