import React from 'react'
import { Tab } from 'semantic-ui-react'
import Status from './Status'
import Graduated from './StatusGraduated'

const StatusPanel = () => {
  const panes = [
    { menuItem: 'Attainments', render: () => <Status /> },
    { menuItem: 'Graduations', render: () => <Graduated /> }
  ]
  return <Tab panes={panes} />
}

export default StatusPanel
