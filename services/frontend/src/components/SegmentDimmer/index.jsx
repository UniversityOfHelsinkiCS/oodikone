import React from 'react'
import { bool } from 'prop-types'
import { Dimmer, Loader } from 'semantic-ui-react'

const SegmentDimmer = ({ isLoading = false }) => (
  <Dimmer active={isLoading} inverted>
    <Loader>Loading</Loader>
  </Dimmer>
)

SegmentDimmer.propTypes = {
  isLoading: bool.isRequired,
}

export default SegmentDimmer
