import { difference, includes, isEqual, union } from 'lodash'
import { useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { formatToArray } from '@oodikone/shared/util'
import { FilterTrayProps } from '../FilterTray'
import { createFilter } from './createFilter'

const IconButton = ({ onClick, ...props }) => (
  <Button icon onClick={onClick} style={{ background: 'none', padding: '0 0.15em' }} type="button">
    <Icon {...props} style={{ color: '#5a5a5a', marginRight: 0 }} />
  </Button>
)

const EditableList = ({ value, onChange, renderLabel }) => {
  const [inputValue, setInput] = useState('')

  return (
    <div style={{ border: '1px solid #dbdbdb', borderRadius: '3pt' }}>
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
        {value.map((studentNumber, index: number) => (
          <li
            className={'asdasd'}
            key={studentNumber}
            style={{
              alignItems: 'center',
              borderTop: index ? '1px solid #e6e6e7' : undefined,
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
                onChange(difference(value, [studentNumber]))
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
      <div style={{ borderTop: '1px solid #e6e6e7', display: 'flex', height: '1.75em' }}>
        <input
          onChange={event => setInput(event.target.value)}
          placeholder="Student number(s)"
          style={{
            border: 'none',
            outline: 'none',
            flexGrow: 1,
            fontSize: '0.9em',
            minWidth: 0,
            paddingLeft: '0.3em',
          }}
          type="text"
          value={inputValue}
        />
        <div style={{ backgroundColor: '#e6e6e7', width: '1px' }} />
        <IconButton
          name="plus"
          onClick={() => {
            const parts = inputValue.split(/[^0-9]+/)
            onChange(union(value, parts))
            setInput('')
          }}
          title="Add to list"
        />
        <IconButton
          name="minus"
          onClick={() => {
            const parts = inputValue.split(/[^0-9]+/)
            onChange(difference(value, parts))
            setInput('')
          }}
          title="Remove from list"
        />
        <IconButton name="trash alternate outline" onClick={() => onChange([])} title="Clear list" />
      </div>
    </div>
  )
}

const StudentNumberFilterCard = ({ options, onOptionsChange, students }: FilterTrayProps) => {
  const swapLists = () => {
    onOptionsChange({
      allowlist: options.blocklist,
      blocklist: options.allowlist,
    })
  }

  const labelRenderer = studentNumber => {
    const studentIsPresent = students.some(student => student.studentNumber === studentNumber)
    return (
      <Icon
        name={studentIsPresent ? 'check' : 'x'}
        style={{
          color: studentIsPresent ? '#31ac31' : '#df4747',
          cursor: 'help',
          fontSize: '0.8em',
          marginLeft: '0.3em',
          position: 'relative',
          top: '-3px',
        }}
        title={
          studentIsPresent ? 'Filter was applied to this student' : 'This student was not present in the population'
        }
      />
    )
  }

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

  filter(student, { options }) {
    const { allowlist, blocklist } = options

    return (
      (allowlist.length === 0 || includes(allowlist, student.studentNumber)) &&
      (blocklist.length === 0 || !includes(blocklist, student.studentNumber))
    )
  },

  render: StudentNumberFilterCard,

  actions: {
    addToAllowlist: (options, students) => {
      const sns = formatToArray(students)
      options.allowlist = union(options.allowlist, sns)
    },

    setAllowlist: (options, students) => {
      const sns = formatToArray(students)
      options.allowlist = sns
    },

    addToBlocklist: (options, students) => {
      const sns = formatToArray(students)
      options.blocklist = union(options.blocklist, sns)
    },

    setBlocklist: (options, students) => {
      const sns = formatToArray(students)
      options.blocklist = sns
    },
  },

  selectors: {
    studentListIsEqualToAllowlist: ({ allowlist }, students) => students.length > 0 && isEqual(allowlist, students),
  },
})
