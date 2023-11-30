import React from 'react'
import { Popup, Segment, Icon } from 'semantic-ui-react'

const getP = (a, b) => {
  if (a === 0 || b === 0) return 1
  return a / b
}

const mapValueToRange = (x, min1, max1, min2, max2) => {
  if (x < min1) return min2
  if (x > max1) return max2
  return ((x - min1) * (max2 - min2)) / (max1 - min1) + min2
}

export const StatusCard = ({
  clickable,
  currentValue,
  changeRange,
  onClick,
  previousValue,
  title,
  tooltip,
  type,
  unit,
  yearlyValues,
  precision,
}) => {
  const diff = currentValue - previousValue
  const p = getP(currentValue, previousValue)
  const change = p - 1

  const getColor = v => {
    if (v > 0.025) return '#6ab04c'
    if (v < -0.025) return '#ff7979'
    return '#7B9FCF'
  }

  const plussify = (x, decimals = 0) =>
    x.toLocaleString('fi', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      signDisplay: 'always',
    })

  const getDisplayValue = number =>
    number.toLocaleString('fi', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })

  let titleEl = <span className="status-title">{title}</span>

  if (tooltip) {
    titleEl = (
      <Popup position="bottom center" size="tiny" trigger={titleEl}>
        {tooltip}
      </Popup>
    )
  }

  const arrowAngle = -mapValueToRange(change * 100, changeRange[0], changeRange[1], -45, 45)

  return (
    <Segment
      className="status-card"
      onClick={clickable ? onClick : null}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
        maxWidth: '240px',
        minWidth: '240px',
        cursor: clickable ? 'pointer' : 'default',
        flex: 1,
        margin: 0,
      }}
      textAlign="center"
      compact
    >
      <div style={{ paddingTop: '100%', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflowWrap: 'break-word',
          }}
        >
          {titleEl}
          <div style={{ margin: '10px 0' }}>
            <Icon
              style={{
                color: getColor(change),
                transform: `rotateZ(${arrowAngle}deg)`,
                transitionProperty: 'transform',
                transitionDuration: '200ms',
              }}
              size="huge"
              name="arrow right"
            />
          </div>
          <div>
            <span style={{ fontSize: 20, fontWeight: 'bold', color: getColor(change) }}>
              {plussify(diff, precision)}
            </span>
            <br />
            <span style={{ fontWeight: 'bold', color: getColor(change) }}>({plussify(change * 100, 1)}%)</span>
            <br />
          </div>
        </div>
      </div>
      {yearlyValues && (
        <div className={`years item-type-${type}`}>
          {yearlyValues.map(({ label, accumulated, total }) => (
            <span className="year-row" key={label}>
              <b className="year-label">{label}:</b>
              <span className="year-value">{getDisplayValue(accumulated)}</span>
              <span className="separator">{typeof total === 'number' ? '/' : ''}</span>
              <span className="year-value">{typeof total === 'number' && getDisplayValue(total)}</span>
              <span className="unit">{unit && unit}</span>
            </span>
          ))}
        </div>
      )}
    </Segment>
  )
}
