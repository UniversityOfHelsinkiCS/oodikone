import _ from 'lodash'
import React, { useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { createFilter } from './createFilter'

const IconButton = ({ onClick, ...props }) => (
  <button
    onClick={onClick}
    style={{
      alignSelf: 'stretch',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0 0.15em',
    }}
    type="button"
  >
    <Icon {...props} style={_.merge(props.style ?? {}, { color: '#5a5a5a', marginRight: 0 })} />
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
          listStyle: 'none',
          margin: 0,
          maxHeight: '10em',
          overflowY: 'auto',
          padding: 0,
          scrollbarWidth: 'thin',
        }}
      >
        {value.map((studentNumber, index) => (
          <li
            key={studentNumber}
            style={{
              alignItems: 'center',
              borderTop: index > 0 && '0px solid #e6e6e7',
              display: 'flex',
              height: '1.75em',
            }}
          >
            <span style={{ fontSize: '0.9em', marginLeft: '0.3em' }}>{studentNumber}</span>
            {renderLabel?.(studentNumber)}
            <span style={{ flexGrow: 1 }} />
            <IconButton
              name="x"
              onClick={() => {
                onChange(_.difference(value, [studentNumber]))
              }}
            />
          </li>
        ))}
        {value.length === 0 && (
          <li
            style={{
              color: 'gray',
              fontSize: '0.9em',
              fontStyle: 'italic',
              height: '1.75em',
              lineHeight: '1.75em',
              paddingLeft: '0.3em',
            }}
          >
            Empty
          </li>
        )}
      </ul>
      <div
        style={{
          alignItems: 'center',
          borderTop: '1px solid #e6e6e7',
          display: 'flex',
          height: '1.75em',
          width: '100%',
        }}
      >
        <input
          onChange={event => setInput(event.target.value)}
          placeholder="Student number(s)"
          style={{
            alignSelf: 'stretch',
            border: 'none',
            borderBottomLeftRadius: '3pt',
            flexGrow: 1,
            fontSize: '0.9em',
            minWidth: 0,
            paddingLeft: '0.3em',
            position: 'relative',
            zIndex: 10,
          }}
          type="text"
          value={inputValue}
        />
        <div style={{ alignSelf: 'stretch', backgroundColor: '#e6e6e7', width: '1px' }} />
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

  const labelRenderer = studentNumber =>
    students.find(student => student.studentNumber === studentNumber) ? (
      <Icon
        name="check"
        style={{
          color: '#31ac31',
          cursor: 'help',
          fontSize: '0.8em',
          marginLeft: '0.3em',
          position: 'relative',
          top: '-3px',
        }}
        title="Filter was applied to this student"
      />
    ) : (
      <Icon
        name="x"
        style={{
          color: 'rgb(223, 71, 71)',
          cursor: 'help',
          fontSize: '0.8em',
          marginLeft: '0.3em',
          position: 'relative',
          top: '-3px',
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

  title: 'Student number',

  defaultOptions: {
    allowlist: [],
    blocklist: [],
  },

  info: filterToolTips.studentNumber,

  isActive: ({ allowlist, blocklist }) => allowlist.length > 0 || blocklist.length > 0,

  filter(student, { allowlist, blocklist }) {
    return (
      (allowlist.length === 0 || _.includes(allowlist, student.studentNumber)) &&
      (blocklist.length === 0 || !_.includes(blocklist, student.studentNumber))
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
