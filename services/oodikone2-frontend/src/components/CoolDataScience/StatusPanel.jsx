import React from 'react'
import { Tab, Segment } from 'semantic-ui-react'
import Status from './Status'
import Graduated from './StatusGraduated'

const StatusPanel = () => {
  const panes = [
    { menuItem: 'Attainments', render: () => <Status /> },
    { menuItem: 'Graduations', render: () => <Graduated /> }
  ]
  return (
    <Segment>
      <Tab panes={panes} />
    </Segment>
  )
}

export default StatusPanel
