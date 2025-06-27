import dayjs from 'dayjs'
import { useRef } from 'react'
import Datetime from 'react-datetime'
import { Icon, Button } from 'semantic-ui-react'
import 'dayjs/locale/fi'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import { useGetSemestersQuery } from '@/redux/semesters'
import { formatDate } from '@/util/timeAndDate'
import './style.css'

const semesterListStyles = {
  maxHeight: '10em',
  overflowY: 'auto',
  padding: 0,
  margin: '0px -4px -4px -4px',
  borderTop: '1px solid #f9f9f9',
}

export const DateTimeSelector = ({ value, onChange, before, after, showSemesters }) => {
  const datetimeRef = useRef()
  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters } = semesters ?? { semesters: {} }
  const today = dayjs().endOf('day')
  const { getTextIn } = useLanguage()
  // Do not allow to select dates after today. At least some cases program just crashed.
  const startdate = before || today
  return (
    <Datetime
      closeOnSelect
      isValidDate={date => {
        return date.isBefore(dayjs(startdate)) && (!after || date.isAfter(dayjs(after)))
      }}
      locale="fi"
      onChange={onChange}
      ref={datetimeRef}
      renderInput={(_, open) => (
        <Button
          className="credit-date-filter-input"
          icon={value !== null}
          onClick={open}
          size="mini"
          style={{
            whiteSpace: 'nowrap',
            paddingRight: value ? '3.5em !important' : undefined,
            paddingLeft: value ? '1em !important' : undefined,
          }}
        >
          {value === null ? 'Select date' : formatDate(value, DateFormat.DISPLAY_DATE)}
          {value !== null && (
            <Icon
              name="x"
              onClick={event => {
                event.stopPropagation()
                onChange(null)
              }}
            />
          )}
        </Button>
      )}
      renderView={(mode, renderDefault) => {
        const createDateButton = (date, label) => (
          <button
            className="date-picker-semester-button"
            key={label}
            onClick={() => {
              datetimeRef.current.setViewDate(dayjs(date))
              onChange(dayjs(date))
            }}
            style={{
              height: '1.75em',
              background: value && value.isSame(date, 'day') ? '#428bca' : 'white',
              color: value && value.isSame(date, 'day') ? 'white' : 'inherit',
            }}
            type="button"
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
                        const start = dayjs(startdate)
                        const end = dayjs(enddate)

                        return start.isBefore() && (!before || start.isBefore(before)) && (!after || end.isAfter(after))
                      })
                      .sort((a, b) => new Date(b.startdate) - new Date(a.startdate))
                      .map(({ name, startdate, enddate }) => (
                        <li
                          key={`${getTextIn(name)}-${Math.random()}`}
                          style={{ padding: '0.2em 0.3em 0.2em', display: 'flex', alignItems: 'center' }}
                        >
                          <span key={getTextIn(name)} style={{ flexGrow: 1 }}>
                            {getTextIn(name)}
                          </span>
                          {createDateButton(dayjs(startdate), 'Start')}
                          {createDateButton(dayjs(enddate).subtract(1, 'days'), 'End')}
                        </li>
                      ))}
                </ul>
              </>
            )}
          </>
        )
      }}
      timeFormat={false}
      value={value}
    />
  )
}
