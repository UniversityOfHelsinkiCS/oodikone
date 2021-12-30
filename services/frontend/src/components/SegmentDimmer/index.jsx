import React from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'

const SegmentDimmer = ({ isLoading = false }) => (
  <Dimmer active={isLoading} inverted>
    <Loader>Loading</Loader>
  </Dimmer>
)

export default SegmentDimmer
