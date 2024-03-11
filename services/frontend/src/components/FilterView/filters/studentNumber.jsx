import _ from 'lodash'
import React, { useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { createFilter } from './createFilter'

const IconButton = ({ onClick, ...props }) => (
  <button
    onClick={onClick}
    style={{ background: 'none', border: 'none', alignSelf: 'stretch', padding: '0 0.15em', cursor: 'pointer' }}
    type="button"
  >
    <Icon {...props} style={_.merge(props.style ?? {}, { marginRight: 0, color: '#5a5a5a' })} />
  </button>
)

const EditableList = ({ value, onChange, renderLabel }) => {
  const [inputValue, setInput] = useState('')

  return (
    <div
      style={{
        border: '1px solid #dbdbdb',
        borderRadius: '3pt',
      }}
    >
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          maxHeight: '10em',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
        }}
      >
        {value.map((sn, i) => (
          <li
            key={sn}
            style={{ display: 'flex', borderTop: i > 0 && '0px solid #e6e6e7', height: '1.75em', alignItems: 'center' }}
          >
            <span style={{ marginLeft: '0.3em', fontSize: '0.9em' }}>{sn}</span>
            {renderLabel?.(sn)}
            <span style={{ flexGrow: 1 }} />
            <IconButton
              name="x"
              onClick={() => {
                onChange(_.difference(value, [sn]))
              }}
            />
          </li>
        ))}
        {value.length === 0 && (
          <li
            style={{
              paddingLeft: '0.3em',
              color: 'gray',
              height: '1.75em',
              fontSize: '0.9em',
              lineHeight: '1.75em',
              fontStyle: 'italic',
            }}
          >
            Empty
          </li>
        )}
      </ul>
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '1.75em',
          borderTop: '1px solid #e6e6e7',
          alignItems: 'center',
        }}
      >
        <input
          onChange={evt => setInput(evt.target.value)}
          placeholder="Student number(s)"
          style={{
            flexGrow: 1,
            border: 'none',
            minWidth: 0,
            alignSelf: 'stretch',
            fontSize: '0.9em',
            paddingLeft: '0.3em',
            borderBottomLeftRadius: '3pt',
            zIndex: 10,
            position: 'relative',
          }}
          type="text"
          value={inputValue}
        />
        <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: '#e6e6e7' }} />
        <IconButton
          name="plus"
          onClick={() => {
            const parts = inputValue.split(/[^0-9]+/)
            onChange(_.union(value, parts))
            setInput('')
          }}
          title="Add to list"
        />
        <IconButton
          name="minus"
          onClick={() => {
            const parts = inputValue.split(/[^0-9]+/)
            onChange(_.difference(value, parts))
            setInput('')
          }}
          title="Remove from list"
        />
        <IconButton name="trash alternate outline" onClick={() => onChange([])} title="Clear list" />
      </div>
    </div>
  )
}

const StudentNumberFilterCard = ({ options, onOptionsChange, withoutSelf }) => {
  const students = withoutSelf()

  const swapLists = () => {
    onOptionsChange({
      allowlist: options.blocklist,
      blocklist: options.allowlist,
    })
  }

  const labelRenderer = sn =>
    students.find(s => s.studentNumber === sn) ? (
      <Icon
        name="check"
        style={{
          color: '#31ac31',
          cursor: 'help',
          position: 'relative',
          top: '-3px',
          fontSize: '0.8em',
          marginLeft: '0.3em',
        }}
        title="Filter was applied to this student"
      />
    ) : (
      <Icon
        name="x"
        style={{
          color: 'rgb(223, 71, 71)',
          cursor: 'help',
          position: 'relative',
          top: '-3px',
          fontSize: '0.8em',
          marginLeft: '0.3em',
        }}
        title="This student was not present in the population"
      />
    )

  return (
    <div>
      <h3 style={{ fontSize: '0.8em', marginBottom: '0.5em' }}>Allowlist</h3>
      <EditableList
        onChange={allowlist => onOptionsChange({ ...options, allowlist })}
        renderLabel={labelRenderer}
        value={options.allowlist}
      />
      <Button icon labelPosition="right" onClick={swapLists} size="mini" style={{ marginTop: '0.5em' }}>
        <Icon name="exchange" rotated="clockwise" />
        Swap lists
      </Button>
      <h3 style={{ fontSize: '0.8em', marginTop: '0.5em', marginBottom: '0.5em' }}>Blocklist</h3>
      <EditableList
        onChange={blocklist => onOptionsChange({ ...options, blocklist })}
        renderLabel={labelRenderer}
        value={options.blocklist}
      />
    </div>
  )
}

export const studentNumberFilter = createFilter({
  key: 'studentNumber',

  title: 'Student Number',

  defaultOptions: {
    allowlist: [],
    blocklist: [],
  },

  info: filterToolTips.studentNumber,

  isActive: ({ allowlist, blocklist }) => allowlist.length > 0 || blocklist.length > 0,

  filter(student, { allowlist, blocklist }) {
    const sn = student.studentNumber

    return (
      (allowlist.length === 0 || _.includes(allowlist, sn)) && (blocklist.length === 0 || !_.includes(blocklist, sn))
    )
  },

  render: props => <StudentNumberFilterCard {...props} />,

  actions: {
    addToAllowlist: (options, students) => {
      const sns = Array.isArray(students) ? students : [students]
      options.allowlist = _.union(options.allowlist, sns)
    },

    setAllowlist: (options, students) => {
      const sns = Array.isArray(students) ? students : [students]
      options.allowlist = sns
    },

    addToBlocklist: (options, students) => {
      const sns = Array.isArray(students) ? students : [students]
      options.blocklist = _.union(options.blocklist, sns)
    },

    setBlocklist: (options, students) => {
      const sns = Array.isArray(students) ? students : [students]
      options.blocklist = sns
    },
  },
})
