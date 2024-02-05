import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Icon, Menu, Radio } from 'semantic-ui-react'
import { getCourseAlternatives } from '../../../../selectors/courseStats'
import { HelpButton } from '../HelpButton'
import { PaneContent } from '../PaneContent'
import { UnifyRadioButtons } from '../UnifyRadioButtons'
import { AttemptsTable } from './Tables/attempts'
import { PassRateContent, PassRateSettings } from './passRate'

const AttemptsTableSettings = ({ value, onChange, availableStats, onSeparateChange }) => {
  const { showGrades, separate } = value

  return (
    <div>
      <Menu style={{ flexWrap: 'wrap' }} secondary>
        <Menu.Item>
          <Radio
            toggle
            label="Show grades"
            data-cy="gradeToggle"
            checked={showGrades}
            onChange={() => onChange({ ...value, showGrades: !showGrades })}
          />
        </Menu.Item>
        <Menu.Item>
          <Radio
            toggle
            label="Separate by semesters"
            data-cy="separateToggle"
            checked={separate}
            onChange={() => onSeparateChange(!separate)}
          />
        </Menu.Item>
        <Menu.Item>
          <HelpButton tab="Tables" viewMode="ATTEMPTS" />
        </Menu.Item>
      </Menu>
      <UnifyRadioButtons availableStats={availableStats} />
    </div>
  )
}

const AttemptsTableContent = ({ settings, ...otherProps }) => {
  const alternatives = useSelector(getCourseAlternatives)
  const openOrRegular = useSelector(state => state.courseSearch.openOrRegular)
  return <AttemptsTable settings={settings} {...otherProps} alternatives={alternatives} unifyCourses={openOrRegular} />
}

export const AttemptsPane = ({ initialSettings, datasets, availableStats, updateQuery, ...rest }) => {
  const [settings, setSettings] = useState({ viewMode: 'ATTEMPTS', ...initialSettings })
  const [splitDirection, setSplitDirection] = useState('row')

  const toggleSeparate = separate => {
    setSettings({ ...settings, separate })
    updateQuery(separate)
  }

  return (
    <PaneContent>
      <div style={{ display: 'flex', marginBottom: '2em' }}>
        <AttemptsTableSettings
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
            <div key={data.name} style={{ flexGrow: 1, flexBasis: 1, width: '100%' }}>
              <h3>{data.name}</h3>
              <AttemptsTableContent data={data} settings={settings} {...rest} />
            </div>
          ))}
      </div>
      <div style={{ display: 'flex', marginBottom: '2em' }}>
        <PassRateSettings
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
            <div key={data.name} style={{ flexGrow: 1, flexBasis: 1, width: '100%' }}>
              <h3>{data.name}</h3>
              <PassRateContent data={data} settings={settings} {...rest} />
            </div>
          ))}
      </div>
    </PaneContent>
  )
}
