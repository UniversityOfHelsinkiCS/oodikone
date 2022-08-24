import React, { useState, useImperativeHandle } from 'react'
import { Button, Icon, Table, Label } from 'semantic-ui-react'

const BasicRow = ({ icon, yearArray, cypress, yearIndex, toggleVisibility, styles }) => {
  return (
    <Table.Row style={styles} key={`Basic-row-${cypress}-${yearIndex}`}>
      {yearArray?.map((value, idx) => (
        <Table.Cell key={`random-button-cell-key-${Math.random()}`}>
          {idx === 0 ? (
            <Button
              as="div"
              onClick={toggleVisibility}
              labelPosition="right"
              style={{ backgroundColor: 'white', borderRadius: 0 }}
              data-cy={`Button-${cypress}-${yearIndex}`}
            >
              <Button icon style={{ backgroundColor: 'white', borderRadius: 0 }}>
                <Icon name={icon} />
              </Button>
              <Label as="a" style={{ backgroundColor: 'white', borderRadius: 0 }}>
                {value}
              </Label>
            </Button>
          ) : (
            value
          )}
        </Table.Cell>
      ))}
    </Table.Row>
  )
}

const ToggleTableView = React.forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false)

  const toggleVisibility = () => {
    setVisible(!visible)
  }
  useImperativeHandle(ref, () => {
    return toggleVisibility
  })
  const chartRowStyles = {
    display: visible ? '' : 'none',
  }

  return (
    <React.Fragment key={`random-fragment-key-${Math.random()}`}>
      <BasicRow
        icon={visible ? 'chevron down' : 'chevron right'}
        yearArray={props.yearArray}
        cypress={visible ? `Hide-${props.cypress}` : `Show-${props.cypress}`}
        yearIndex={props.yearIndex}
        toggleVisibility={toggleVisibility}
      />
      <Table.Row key={`stack-row-key-${Math.random()}`} style={chartRowStyles}>
        {props.children}
      </Table.Row>
    </React.Fragment>
  )
})

ToggleTableView.displayName = 'ToggleTableView'

export default ToggleTableView
