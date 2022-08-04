import React, { useState, useImperativeHandle } from 'react'
import { Button, Table } from 'semantic-ui-react'

const ToggleTableView = React.forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false)

  const toggleVisibility = () => {
    setVisible(!visible)
  }
  useImperativeHandle(ref, () => {
    return toggleVisibility
  })

  return (
    <>
      <Table.Row key={`random-year-key-${Math.random()}`}>
        {props.yearArray?.map((value, idx) => (
          <>
            {idx === 0 ? (
              <Table.Cell key={`random-button-cell-key-${Math.random()}`}>
                <Button
                  key={`random-button-{value}-${Math.random()}`}
                  className="ui tiny basic button"
                  onClick={toggleVisibility}
                >
                  {value}
                </Button>
              </Table.Cell>
            ) : (
              <Table.Cell key={`random-cell-key-${Math.random()}`}>{value}</Table.Cell>
            )}
          </>
        ))}
      </Table.Row>
      <Table.Row key={`stack-row-key-${Math.random()}`} style={{ rowSpan: 100, display: visible ? '' : 'none' }}>
        {props.children}
      </Table.Row>
    </>
  )
})

ToggleTableView.displayName = 'ToggleTableView'

export default ToggleTableView
