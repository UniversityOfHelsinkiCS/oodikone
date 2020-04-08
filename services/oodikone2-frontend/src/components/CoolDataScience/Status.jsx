import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Segment, Loader, Dimmer, Icon } from 'semantic-ui-react'
import _ from 'lodash'
import { getTextIn } from '../../common'

import { callApi } from '../../apiConnection'

const mapValueToRange = (x, min1, max1, min2, max2) => {
  if (x < min1) return min2
  if (x > max1) return max2
  return ((x - min1) * (max2 - min2)) / (max1 - min1) + min2
}

const StatusContainer = ({ title, current, previous, clickable, handleClick, min1, max1 }) => {
  const diff = Math.round(current - previous)
  const p = current / previous
  const change = Math.round((p - 1) * 1000) / 10

  const getColor = () => {
    if (change > 2.5) return '#6ab04c'
    if (change < -2.5) return '#ff7979'
    return '#7B9FCF'
  }

  const plussify = x => {
    if (x > 0) return `+${x}`
    return x
  }

  return (
    <Segment
      onClick={clickable ? handleClick : null}
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '200px',
        minWidth: '200px',
        cursor: clickable ? 'pointer' : 'default',
        flex: 1,
        margin: 0
      }}
      textAlign="center"
      compact
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ all: 'unset', fontWeight: 'bold' }}>{title}</h2>
        <div style={{ margin: '10px 0' }}>
          <Icon
            style={{
              color: getColor(),
              transform: `rotateZ(${-mapValueToRange(change, min1, max1, -45, 45)}deg)`
            }}
            size="huge"
            name="arrow right"
          />
        </div>
        <div>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: getColor() }}>{plussify(diff)}</span>
          <br />
          <span style={{ fontWeight: 'bold', color: getColor() }}>({plussify(change)}%)</span>
        </div>
      </div>
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
  max1: PropTypes.number.isRequired
}

const Status = () => {
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

  if (!data || loading)
    return (
      <Segment style={{ padding: '40px' }} textAlign="center">
        <Dimmer inverted active />
        <Loader active={loading} />
      </Segment>
    )

  return (
    <div>
      {selected && (
        <Icon onClick={() => setSelected(null)} style={{ fontSize: '40px', cursor: 'pointer' }} name="arrow left" />
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 200px)',
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
              min1={selected ? -18 : -7}
              max1={selected ? 18 : 7}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Status
