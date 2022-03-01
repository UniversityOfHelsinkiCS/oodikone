import React, { useState } from 'react'
import { Tab, Segment, Menu, Icon } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { PassRate, PassRateSettings } from './Panes/passRate'
import { Distribution, DistributionSettings } from './Panes/distribution'
import { Tables, TablesSettings } from './Panes/tables'
import { useTabs } from '../../../common/hooks'

import './resultTabs.css'
import TSA from '../../../common/tsa'

const ANALYTICS_CATEGORY = 'Course Statistics'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const PaneContent = ({ component: Component, settings: SettingsComponent, initialSettings, datasets, ...rest }) => {
  const [settings, setSettings] = useState(initialSettings)
  const [splitDirection, setSplitDirection] = useState('row')

  return (
    <Tab.Pane>
      <Segment basic>
        <div style={{ display: 'flex', marginBottom: '2em' }}>
          <SettingsComponent value={settings} onChange={setSettings} />
          <div style={{ flexGrow: 1 }} />
          {datasets.filter(i => i).length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
              <label>Split direction: </label>
              <Menu style={{ margin: 0 }}>
                <Menu.Item active={splitDirection === 'row'} onClick={() => setSplitDirection('row')}>
                  <Icon name="arrows alternate horizontal" />
                </Menu.Item>
                <Menu.Item active={splitDirection === 'column'} onClick={() => setSplitDirection('column')}>
                  <Icon name="arrows alternate vertical" />
                </Menu.Item>
              </Menu>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: splitDirection, gap: '2em' }}>
          {datasets
            .filter(i => i)
            .map(data => (
              <div style={{ flexGrow: 1, flexBasis: 1 }}>
                <h3>{data.name}</h3>
                <Component data={data} settings={settings} {...rest} />
              </div>
            ))}
        </div>
      </Segment>
    </Tab.Pane>
  )
}

const ResultTabs = ({ primary, comparison, history, separate }) => {
  const [tab, setTab] = useTabs('cs_tab', 0, history)
  const { userHasAccessToAllStats } = primary

  const handleTabChange = (...params) => {
    const { activeIndex } = params[1]
    const currentTab = params[1].panes[activeIndex]
    sendAnalytics(`Current tab '${currentTab.menuItem.content}'`, 'Course statistics')
    setTab(...params)
  }

  const paneTypes = [
    {
      label: 'Tables',
      icon: 'table',
      initialSettings: { showDetails: false, viewMode: 'STUDENT', separate },
      settings: TablesSettings,
      component: Tables,
    },
    {
      label: 'Pass rate chart',
      icon: 'balance',
      initialSettings: { viewMode: 'STUDENT', separate },
      settings: PassRateSettings,
      component: PassRate,
    },
    {
      label: 'Grade distribution chart',
      icon: 'chart bar',
      initialSettings: { isRelative: false, viewMode: 'STUDENT' },
      settings: DistributionSettings,
      component: Distribution,
    },
  ]

  const panes = paneTypes.map(
    ({ icon, label, initialSettings, component: Component, settings: SettingsComponent }) => ({
      menuItem: { icon, content: label },
      render: () => (
        <PaneContent
          component={Component}
          settings={SettingsComponent}
          userHasAccessToAllStats={userHasAccessToAllStats}
          initialSettings={initialSettings}
          datasets={[primary, comparison]}
        />
      ),
    })
  )

  return (
    <div>
      <Tab id="CourseStatPanes" panes={panes} onTabChange={handleTabChange} activeIndex={tab} />
    </div>
  )
}

export default withRouter(ResultTabs)
