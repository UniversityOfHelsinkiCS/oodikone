import React, { useState } from 'react'
import ReactHighcharts from 'react-highcharts'
import { Icon, Menu, Segment, Radio, Tab } from 'semantic-ui-react'
import { gradeGraphOptions } from '../../../../constants'
import { HelpButton } from '../HelpButton'
import {
  absoluteToRelative,
  getDataObject,
  getGradeSpread,
  getMaxValueOfSeries,
  getThesisGradeSpread,
  isThesisSeries,
} from './util'

const getGradeSeries = series => {
  const isGradeSeries = !isThesisSeries(series)
  const newSeries = isGradeSeries ? getGradeSpread(series) : getThesisGradeSpread(series)
  const sumAll = Object.values(newSeries)[0].map((_, idx) =>
    Object.values(newSeries)
      .map(serie => serie[idx])
      .reduce((a, b) => a + b, 0)
  )
  return isGradeSeries
    ? {
        absolute: [
          getDataObject('0', newSeries[0], 'a'),
          getDataObject('1', newSeries[1], 'b'),
          getDataObject('2', newSeries[2], 'c'),
          getDataObject('3', newSeries[3], 'd'),
          getDataObject('4', newSeries[4], 'e'),
          getDataObject('5', newSeries[5], 'f'),
          getDataObject('HT', newSeries.HT, 'g'),
          getDataObject('TT', newSeries.TT, 'h'),
          getDataObject('Hyv.', newSeries['Hyv.'], 'i'),
        ],
        relative: [
          getDataObject('0', newSeries[0].map(absoluteToRelative(sumAll)), 'a'),
          getDataObject('1', newSeries[1].map(absoluteToRelative(sumAll)), 'b'),
          getDataObject('2', newSeries[2].map(absoluteToRelative(sumAll)), 'c'),
          getDataObject('3', newSeries[3].map(absoluteToRelative(sumAll)), 'd'),
          getDataObject('4', newSeries[4].map(absoluteToRelative(sumAll)), 'e'),
          getDataObject('5', newSeries[5].map(absoluteToRelative(sumAll)), 'f'),
          getDataObject('HT', newSeries.HT.map(absoluteToRelative(sumAll)), 'g'),
          getDataObject('TT', newSeries.TT.map(absoluteToRelative(sumAll)), 'h'),
          getDataObject('Hyv.', newSeries['Hyv.'].map(absoluteToRelative(sumAll)), 'i'),
        ],
      }
    : {
        absolute: [
          getDataObject('I', newSeries.I, 'a'),
          getDataObject('A', newSeries.A, 'b'),
          getDataObject('NSLA', newSeries.NSLA, 'c'),
          getDataObject('LUB', newSeries.LUB, 'd'),
          getDataObject('CL', newSeries.CL, 'e'),
          getDataObject('MCLA', newSeries.MCLA, 'f'),
          getDataObject('ECLA', newSeries.ECLA, 'g'),
          getDataObject('L', newSeries.L, 'h'),
        ],
        relative: [
          getDataObject('I', newSeries.I.map(absoluteToRelative(sumAll)), 'a'),
          getDataObject('A', newSeries.A.map(absoluteToRelative(sumAll)), 'b'),
          getDataObject('NSLA', newSeries.NSLA.map(absoluteToRelative(sumAll)), 'c'),
          getDataObject('LUB', newSeries.LUB.map(absoluteToRelative(sumAll)), 'd'),
          getDataObject('CL', newSeries.CL.map(absoluteToRelative(sumAll)), 'e'),
          getDataObject('MCLA', newSeries.MCLA.map(absoluteToRelative(sumAll)), 'f'),
          getDataObject('ECLA', newSeries.ECLA.map(absoluteToRelative(sumAll)), 'g'),
          getDataObject('L', newSeries.L.map(absoluteToRelative(sumAll)), 'h'),
        ],
      }
}

const DistributionSettings = ({ value, onChange }) => {
  const { isRelative } = value

  return (
    <Menu secondary style={{ marginBottom: 0 }}>
      <Menu.Item>
        <Radio
          toggle
          label="Show relative"
          checked={isRelative}
          onChange={() => onChange({ ...value, isRelative: !isRelative })}
        />
        <Menu.Item>
          <HelpButton tab="GradeDistribution" />
        </Menu.Item>
      </Menu.Item>
    </Menu>
  )
}

const DistributionContent = ({ data, settings: { isRelative }, userHasAccessToAllStats }) => {
  const stats = data.stats.filter(stat => stat.name !== 'Total' || isRelative)

  const statYears = stats.map(year => year.name)
  const grades = stats.flatMap(s => s.attempts.grades)

  const gradeGraphSeries = getGradeSeries(grades)

  const maxGradeValue = isRelative ? 100 : getMaxValueOfSeries(gradeGraphSeries.absolute)

  const primaryDistributionOptions = gradeGraphOptions(isRelative, statYears, maxGradeValue, 'Grades')

  return (
    <div>
      <ReactHighcharts
        config={{
          ...primaryDistributionOptions,
          series: isRelative ? gradeGraphSeries.relative : gradeGraphSeries.absolute,
        }}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are shown as 0 in the chart</span>
      )}
    </div>
  )
}

export const DistributionPane = ({ initialSettings, datasets, availableStats, updateQuery, ...rest }) => {
  const [settings, setSettings] = useState(initialSettings)
  const [splitDirection, setSplitDirection] = useState('row')

  const toggleSeparate = separate => {
    setSettings({ ...settings, separate })
    updateQuery(separate)
  }

  return (
    <Tab.Pane>
      <Segment basic>
        <div style={{ display: 'flex', marginBottom: '2em' }}>
          <DistributionSettings
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
                <DistributionContent data={data} settings={settings} {...rest} />
              </div>
            ))}
        </div>
      </Segment>
    </Tab.Pane>
  )
}
