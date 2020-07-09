import React from 'react'
import PropTypes from 'prop-types'
import { Button, Icon } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { connect } from 'react-redux'

const ClearFilterButton = ({ disabled, onClick, translate }) => (
  <Button compact color="red" size="tiny" disabled={disabled} onClick={onClick}>
    <Icon name="close" />
    {translate('filters.clearButtonLabel')}
  </Button>
)

ClearFilterButton.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ localize }) => ({ translate: getTranslate(localize) })

export default connect(mapStateToProps)(ClearFilterButton)
