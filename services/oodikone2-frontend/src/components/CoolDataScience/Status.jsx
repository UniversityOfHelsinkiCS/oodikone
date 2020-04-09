import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Segment, Loader, Dimmer, Icon, Checkbox } from 'semantic-ui-react'
import _ from 'lodash'
import { getTextIn } from '../../common'
import { callApi } from '../../apiConnection'
import './status.css'

const mapValueToRange = (x, min1, max1, min2, max2) => {
  if (x < min1) return min2
  if (x > max1) return max2
  return ((x - min1) * (max2 - min2)) / (max1 - min1) + min2
}

const StatusContainer = ({
  title,
  current,
  previous,
  clickable,
  handleClick,
  min1,
  max1,
  showYearlyValues,
  yearlyValues
}) => {
  const diff = Math.round(current - previous)
  const p = current / previous
  const change = Math.round((p - 1) * 1000) / 10

  const getColor = v => {
    if (v > 2.5) return '#6ab04c'
    if (v < -2.5) return '#ff7979'
    return '#7B9FCF'
  }

  const plussify = x => {
    if (x > 0) return `+${x}`
    return x
  }

  return (
    <Segment
      className="status-card"
      onClick={clickable ? handleClick : null}
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '220px',
        minWidth: '220px',
        cursor: clickable ? 'pointer' : 'default',
        flex: 1,
        margin: 0
      }}
      textAlign="center"
      compact
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span className="status-title">{title}</span>
        <div style={{ margin: '10px 0' }}>
          <Icon
            style={{
              color: getColor(change),
              transform: `rotateZ(${-mapValueToRange(change, min1, max1, -45, 45)}deg)`
            }}
            size="huge"
            name="arrow right"
          />
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: getColor(change) }}>{plussify(diff)}</span>
          <br />
          <span style={{ fontWeight: 'bold', color: getColor(change) }}>({plussify(change)}%)</span>
        </div>
      </div>
      {showYearlyValues && (
        <div style={{ marginTop: '10px', textAlign: 'start' }}>
          {_.orderBy(Object.entries(yearlyValues), ([y]) => y, ['desc']).map(([year, { sum }], i) => {
            const yearChange = Math.round((current / sum - 1) * 1000) / 10
            return (
              <div style={{ margin: '5px 0' }} key={year}>
                <span>
                  <b>{year}:</b> {Math.round(sum)}{' '}
                  {i !== 0 && <span style={{ color: getColor(yearChange) }}>({plussify(yearChange)}%)</span>}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Segment>
  )
}

StatusContainer.propTypes = {
  title: PropTypes.string.isRequired,
  current: PropTypes.number.isRequired,
  previous: PropTypes.number.isRequired,
  clickable: PropTypes.bool.isRequired,
  handleClick: PropTypes.func.isRequired,
  min1: PropTypes.number.isRequired,
  max1: PropTypes.number.isRequired,
  showYearlyValues: PropTypes.bool.isRequired,
  yearlyValues: PropTypes.shape({}).isRequired
}

const Status = () => {
  const [showYearlyValues, setShowYearlyValues] = useState(true)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await callApi('/cool-data-science/status', 'get', null)
      setData(res.data)
      setLoading(false)
    }

    load()
  }, [])

  const handleShowYearlyValuesToggled = () => {
    setShowYearlyValues(!showYearlyValues)
  }

  if (!data || loading)
    return (
      <Segment style={{ padding: '40px' }} textAlign="center">
        <Dimmer inverted active />
        <Loader active={loading} />
      </Segment>
    )

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        {selected && (
          <Icon
            onClick={() => setSelected(null)}
            style={{ fontSize: '40px', cursor: 'pointer', marginRight: '20px' }}
            name="arrow left"
          />
        )}
        <Checkbox label="Show yearly" onChange={handleShowYearlyValuesToggled} checked={showYearlyValues} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 220px)',
          gridTemplateRows: 'repeat(auto-fill) 20px',
          gridGap: '20px'
        }}
      >
        {_.orderBy(
          Object.entries(selected || data),
          ([
            ,
            {
              totals: { current, previous }
            }
          ]) => current / previous,
          ['desc']
        ).map(([code, stats]) => {
          return (
            <StatusContainer
              clickable={!selected}
              handleClick={() => setSelected(data[code].programmes)}
              key={code}
              title={getTextIn(stats.name)}
              current={stats.totals.current}
              previous={stats.totals.previous}
              showYearlyValues={showYearlyValues}
              min1={selected ? -18 : -7}
              max1={selected ? 18 : 7}
              yearlyValues={stats.yearly}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Status
