import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Icon, Menu } from 'semantic-ui-react'
import { getCourseAlternatives } from '../../../../selectors/courseStats'
import { PaneContent } from '../PaneContent'
import { StudentsTable } from './Tables/students'
import { StudentsTableSettings } from './Settings/students'
import { PassRateSettings } from './Settings/passRate'
import { PassRateContent } from './passRate'

const StudentsTableContent = ({ settings, ...otherProps }) => {
  const alternatives = useSelector(getCourseAlternatives)
  const openOrRegular = useSelector(state => state.courseSearch.openOrRegular)
  return <StudentsTable settings={settings} {...otherProps} alternatives={alternatives} unifyCourses={openOrRegular} />
}

export const StudentsPane = ({ initialSettings, datasets, availableStats, updateQuery, ...rest }) => {
  const [settings, setSettings] = useState({ viewMode: 'STUDENTS', ...initialSettings })
  const [splitDirection, setSplitDirection] = useState('row')

  const toggleSeparate = separate => {
    setSettings({ ...settings, separate })
    updateQuery(separate)
  }

  const halfWidth = datasets.filter(dataset => dataset).length > 1 && splitDirection === 'row'

  return (
    <PaneContent>
      <div style={{ display: 'flex', marginBottom: '2em' }}>
        <StudentsTableSettings
          value={settings}
          onChange={setSettings}
          onSeparateChange={toggleSeparate}
          availableStats={availableStats}
        />
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
            <div
              key={data.name}
              style={{
                flexGrow: 1,
                flexBasis: 1,
                maxWidth: halfWidth ? '50%' : '100%',
              }}
            >
              <h3>{data.name}</h3>
              <StudentsTableContent data={data} settings={settings} {...rest} />
            </div>
          ))}
      </div>
      <PassRateSettings
        value={settings}
        onChange={setSettings}
        onSeparateChange={toggleSeparate}
        availableStats={availableStats}
      />
      <div style={{ display: 'flex', flexDirection: splitDirection, gap: '2em' }}>
        {datasets
          .filter(i => i)
          .map(data => (
            <div key={data.name} style={{ flexGrow: 1, flexBasis: 1, maxWidth: halfWidth ? '50%' : '100%' }}>
              <h3>{data.name}</h3>
              <PassRateContent data={data} settings={settings} {...rest} />
            </div>
          ))}
      </div>
    </PaneContent>
  )
}
