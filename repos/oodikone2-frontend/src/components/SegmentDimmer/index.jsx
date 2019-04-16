import React from 'react'
import { func, bool } from 'prop-types'
import { Dimmer, Loader } from 'semantic-ui-react'

const SegmentDimmer = ({ translate, isLoading = false }) => (
  <Dimmer active={isLoading} inverted>
    <Loader>{translate('common.loading')}</Loader>
  </Dimmer>
)

SegmentDimmer.propTypes = {
  translate: func.isRequired,
  isLoading: bool.isRequired
}

export default SegmentDimmer
