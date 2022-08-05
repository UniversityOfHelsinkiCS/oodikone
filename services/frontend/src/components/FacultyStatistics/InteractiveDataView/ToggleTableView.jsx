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
  const chartRowStyles = {
    rowSpan: 100,
    display: visible ? '' : 'none',
  }
  return (
    <React.Fragment key={`random-fragment-key-${Math.random()}`}>
      <Table.Row key={`random-year-key-${Math.random()}`}>
        {props.yearArray?.map((value, idx) => (
          <Table.Cell key={`random-button-cell-key-${Math.random()}`}>
            {idx === 0 ? (
              <Button
                data-cy={`Button-${props.cypress}-${props.yearIndex}`}
                className="ui tiny basic button"
                onClick={toggleVisibility}
              >
                {value}
              </Button>
            ) : (
              value
            )}
          </Table.Cell>
        ))}
      </Table.Row>
      <Table.Row key={`stack-row-key-${Math.random()}`} style={chartRowStyles}>
        {props.children}
      </Table.Row>
    </React.Fragment>
  )
})

ToggleTableView.displayName = 'ToggleTableView'

export default ToggleTableView
