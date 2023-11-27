import React from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'

export const SegmentDimmer = ({ isLoading = false }) => (
  <Dimmer active={isLoading} inverted>
    <Loader>Loading</Loader>
  </Dimmer>
)
