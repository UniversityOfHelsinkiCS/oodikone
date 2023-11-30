import React, { useRef, useState } from 'react'
import { Form, Checkbox, Divider, Popup, Button, Icon } from 'semantic-ui-react'
import moment from 'moment'
import 'moment/locale/fi'
import ReactMarkdown from 'react-markdown'
import Datetime from 'react-datetime'
import { WithHelpTooltip } from './WithHelpTooltip'

const unindent = s => s.replace(/(^|\n)[ \t]+/g, '\n')

const isValidDate = d => moment(d).isValid() && moment().endOf('day').diff(moment(d)) >= 0

const DateSetting = ({ onChange, value, onOpenDetails, tooltip, placeholder }) => {
  const DATE_FORMAT = 'DD.MM.YYYY'

  return (
    <div style={{ marginRight: '0.3rem' }}>
      <Form>
        <Form.Field
          error={value !== null && !isValidDate(value)}
          style={{ display: 'flex', alignItems: 'center' }}
          onKeyDown={e => {
            e.preventDefault() // prevents user for typing the date
          }}
        >
          <WithHelpTooltip
            tooltip={tooltip}
            onOpenDetails={onOpenDetails}
            iconStyle={{
              position: 'absolute',
              display: 'flex',
              top: 0,
              bottom: 0,
              right: '0.5rem',
              alignItems: 'center',
            }}
            iconPosition={{
              top: '-0.2em',
            }}
          >
            <Datetime
              className="status-date-time-input"
              dateFormat={DATE_FORMAT}
              timeFormat={false}
              closeOnSelect
              value={moment(value)}
              locale="fi"
              isValidDate={isValidDate}
              inputProps={{ placeholder }}
              onChange={value => {
                if ((typeof value === 'string' && value !== '' && value.length === 10) || isValidDate(value)) {
                  onChange(value) // Change value only if it is valid
                }
              }}
            />
          </WithHelpTooltip>
        </Form.Field>
      </Form>
    </div>
  )
}

const settingWidgetFactories = {
  checkbox: (value, onChange, onOpenDetails, { short, label }) => (
    <WithHelpTooltip tooltip={short} onOpenDetails={onOpenDetails} iconPosition={{ top: '0.1em' }}>
      <Checkbox
        style={{ fontSize: '0.9em', fontWeight: 'normal' }}
        label={label}
        checked={value}
        onChange={() => onChange(!value)}
      />
    </WithHelpTooltip>
  ),
}

const StatusSettings = ({ onSettingChange, value, settings, onOpenDetails }) => {
  const itemStyles = {
    margin: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
  }

  const settingWidgets = settings.map(definition => {
    const { key, type } = definition
    const factory = settingWidgetFactories[type]

    if (!factory) return null

    const content = factory(
      value[key],
      value => onSettingChange(key, value),
      () => onOpenDetails(key),
      definition
    )

    return (
      <div key={key} style={itemStyles}>
        {content}
      </div>
    )
  })

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', padding: 0, flexDirection: 'column' }}>{settingWidgets}</div>
  )
}

export const Toolbar = ({ value, changeSetting, settings, generalHelp }) => {
  const [usageDetailsOpen, setUsageDetailsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const moreDetailsRef = useRef(null)
  const attentionSeekers = useRef({})

  const scrollToAttentionSeeker = el => {
    el.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    })
  }

  const attentionSeekerRef = key => ref => {
    if (ref !== null && attentionSeekers.current[key] === true) {
      scrollToAttentionSeeker(ref)
    }

    attentionSeekers.current[key] = ref
  }

  const openDetails = key => {
    if (moreDetailsRef.current) {
      moreDetailsRef.current.scrollIntoView({
        block: 'start',
        inline: 'end',
        behavior: 'smooth',
      })
    }

    if (attentionSeekers.current[key]) {
      scrollToAttentionSeeker(attentionSeekers.current[key])
    } else {
      attentionSeekers.current[key] = true
    }

    setUsageDetailsOpen(true)
  }

  const dateSetting = settings.find(s => s.type === 'date')

  return (
    <>
      <DateSetting
        value={value[dateSetting.key]}
        onChange={value => changeSetting(dateSetting.key, value)}
        onOpenDetails={() => openDetails(dateSetting.key)}
        tooltip={dateSetting.short}
        placeholder={dateSetting.label}
      />

      <Popup
        trigger={
          <Button>
            <Icon name="settings" /> Asetukset
          </Button>
        }
        position="bottom right"
        on="click"
        wide="very"
        open={settingsOpen}
        onOpen={() => setSettingsOpen(true)}
        onClose={() => {
          // Close the popup only after the event has had a chance to propagate.
          setTimeout(() => setSettingsOpen(false), 0)
        }}
        style={{ padding: '0.25em 0em', maxHeight: '80vh' }}
      >
        <StatusSettings value={value} settings={settings} onSettingChange={changeSetting} onOpenDetails={openDetails} />
      </Popup>
      <div ref={moreDetailsRef} />
      <Popup
        trigger={
          <Button>
            <Icon name="question circle" /> Käyttöohje
          </Button>
        }
        position="bottom right"
        on="click"
        wide="very"
        open={usageDetailsOpen}
        onOpen={() => setUsageDetailsOpen(true)}
        onClose={() => setUsageDetailsOpen(false)}
        style={{ padding: '0', paddingBottom: '0.5em', maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div style={{ padding: '1em' }}>
          {
            // eslint-disable-next-line react/no-children-prop
            <ReactMarkdown children={unindent(generalHelp)} />
          }
        </div>
        {settings.map(({ key, label, long }) => (
          <div key={key}>
            <Divider />
            <div style={{ padding: '0 1em' }} ref={attentionSeekerRef(key)}>
              <b>
                Valinta "<i>{label}</i>"
              </b>
              <div style={{ margin: '0.5em', fontSize: '0.9em' }}>
                <ReactMarkdown>{unindent(long ?? '')}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </Popup>
    </>
  )
}
