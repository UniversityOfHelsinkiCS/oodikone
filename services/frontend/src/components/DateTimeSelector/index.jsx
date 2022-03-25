import React, { useRef } from 'react'
import Datetime from 'react-datetime'
import 'moment/locale/fi'
import { Icon, Button } from 'semantic-ui-react'
import moment from 'moment'
import { useGetSemestersQuery } from 'redux/semesters'
import { getTextIn } from '../../common'

import './style.css'

const semesterListStyles = {
  maxHeight: '10em',
  overflowY: 'auto',
  padding: 0,
  margin: '0 -4px -4px -4px',
  borderTop: '1px solid #f9f9f9',
}

const DateTime = ({ value, onChange, before, after, showSemesters }) => {
  const datetimeRef = useRef()
  const semesterRequest = useGetSemestersQuery()
  const allSemesters = semesterRequest.isLoading ? [] : semesterRequest.data.semesters

  return (
    <Datetime
      ref={datetimeRef}
      value={value}
      onChange={onChange}
      timeFormat={false}
      locale="fi"
      closeOnSelect
      isValidDate={date => (!before || date.isBefore(before)) && (!after || date.isAfter(after))}
      renderView={(mode, renderDefault) => {
        const createDateButton = (date, label) => (
          <button
            type="button"
            onClick={() => {
              datetimeRef.current.setViewDate(moment(date))
              onChange(moment(date))
            }}
            style={{
              height: '1.75em',
              background: value && value.isSame(date, 'day') ? '#428bca' : undefined,
              color: value && value.isSame(date, 'day') ? 'white' : 'inherit',
            }}
            className="date-picker-semester-button"
          >
            {label}
          </button>
        )

        return (
          <>
            {renderDefault()}
            {showSemesters && (
              <>
                <div
                  style={{
                    ...semesterListStyles,
                    height: '1.75em',
                    lineHeight: '1.75em',
                    marginBottom: 0,
                    paddingLeft: '0.3em',
                    fontWeight: 'bold',
                  }}
                >
                  Semesters:
                </div>
                <ul style={semesterListStyles}>
                  {allSemesters &&
                    Object.values(allSemesters)
                      .filter(({ startdate, enddate }) => {
                        const start = moment(startdate)
                        const end = moment(enddate)

                        return start.isBefore() && (!before || start.isBefore(before)) && (!after || end.isAfter(after))
                      })
                      .sort((a, b) => new Date(b.startdate) - new Date(a.startdate))
                      .map(({ name, startdate, enddate }) => (
                        <li style={{ padding: '0.2em 0.3em', display: 'flex', alignItems: 'center' }}>
                          <span style={{ flexGrow: 1 }}>{getTextIn(name)}</span>
                          {createDateButton(startdate, 'Start')}
                          {createDateButton(moment(enddate).subtract(1, 'days'), 'End')}
                        </li>
                      ))}
                </ul>
              </>
            )}
          </>
        )
      }}
      renderInput={(_, open) => (
        <Button
          icon={value !== null}
          labelPosition={value !== null && 'right'}
          onClick={open}
          className="credit-date-filter-input"
          size="mini"
          style={{
            whiteSpace: 'nowrap',
            paddingRight: value ? '3.5em !important' : undefined,
            paddingLeft: value ? '1em !important' : undefined,
          }}
        >
          {value === null ? 'Select Date' : moment(value).format('DD.MM.YYYY')}
          {value !== null && (
            <Icon
              name="x"
              onClick={evt => {
                evt.stopPropagation()
                onChange(null)
              }}
            />
          )}
        </Button>
      )}
    />
  )
}

export default DateTime
