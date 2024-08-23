import { isEqual } from 'lodash'
import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Icon, Header } from 'semantic-ui-react'

import { HoverableHelpPopup } from '@/components/common/HoverableHelpPopup'
import './FilterCard.css'

const useChange = value => {
  const prevValue = useRef()

  if (prevValue.current === undefined) {
    prevValue.current = value
    return true
  }

  const change = !isEqual(value, prevValue.current)

  prevValue.current = value

  return change
}

export const FilterCard = ({ filter, options, children, onClear }) => {
  const title = filter.title ?? filter.key
  const active = filter.isActive(options)
  const { info, key } = filter

  const hasChanged = useChange(options)

  const [manuallyOpened, setManuallyOpened] = useState(null)

  if (hasChanged && manuallyOpened === false) {
    setManuallyOpened(null)
  }

  const open = manuallyOpened !== null ? manuallyOpened : active

  return (
    <div data-cy={`${key}-filter-card`} data-open={open} style={{ margin: '1rem 0' }}>
      <div style={{ marginBottom: '1rem' }}>
        <div
          className="filter-card-header"
          data-cy={`${key}-header`}
          onClick={() => setManuallyOpened(!open)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={open ? 'caret down' : 'caret right'} style={{ flexShrink: 0 }} />
            <Header size="tiny" style={{ margin: '0' }}>
              {title}
            </Header>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5em' }}>
            {active && (
              <div
                style={{
                  backgroundColor: '#2185d0',
                  marginRight: '0.15em',
                  marginTop: '0.2em',
                  borderRadius: '9999px',
                  width: '0.5em',
                  height: '0.5em',
                }}
              />
            )}
            {active && (
              <Icon
                className="filter-clear-icon"
                name="trash alternate outline"
                onClick={event => {
                  event.stopPropagation()
                  onClear()
                }}
                style={{ margin: 0 }}
              />
            )}
            {info && (
              <HoverableHelpPopup
                content={<ReactMarkdown>{info.short}</ReactMarkdown>}
                style={{ cursor: 'auto', margin: 0, color: '#888' }}
              />
            )}
          </div>
        </div>
      </div>
      {open && <div onClick={() => setManuallyOpened(true)}>{children}</div>}
    </div>
  )
}
