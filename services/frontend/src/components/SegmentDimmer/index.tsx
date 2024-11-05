import { Dimmer, Loader } from 'semantic-ui-react'

interface SegmentDimmerProps {
  isLoading?: boolean
}

export const SegmentDimmer = ({ isLoading = false }: SegmentDimmerProps) => (
  <Dimmer active={isLoading} inverted>
    <Loader>Loading</Loader>
  </Dimmer>
)
