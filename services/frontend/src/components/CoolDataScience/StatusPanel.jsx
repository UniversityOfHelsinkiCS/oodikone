import React from 'react'
import { Tab } from 'semantic-ui-react'

import { Status } from './Status'
import { ConnectedStatusGraduated as Graduated } from './StatusGraduated'

export const StatusPanel = () => {
  const panes = [
    {
      menuItem: 'Attainments',
      render: () => (
        <Tab.Pane>
          <Status />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Graduations',
      render: () => (
        <Tab.Pane>
          <Graduated />
        </Tab.Pane>
      ),
    },
  ]
  return <Tab panes={panes} />
}
