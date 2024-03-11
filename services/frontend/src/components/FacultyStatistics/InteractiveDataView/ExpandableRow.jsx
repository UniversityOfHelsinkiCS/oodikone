import React from 'react'
import { Button, Icon, Table, Label } from 'semantic-ui-react'

const roundValue = value => {
  return Number.isInteger(value) ? value : value.toFixed(1)
}

export const ExpandableRow = ({ icon, yearArray, cypress, yearIndex, toggleVisibility, styles }) => {
  return (
    <Table.Row key={`Basic-row-${cypress}-${yearIndex}`} style={styles}>
      {yearArray?.map((value, index) => (
        <Table.Cell key={`random-button-cell-key-${Math.random()}`} textAlign={index === 0 ? 'center' : 'right'}>
          {index === 0 ? (
            <Button
              as="div"
              data-cy={`Button-${cypress}-${yearIndex}`}
              labelPosition="right"
              onClick={toggleVisibility}
              style={{ backgroundColor: 'white', borderRadius: 0, padding: 0, margin: 0 }}
            >
              <Button icon style={{ backgroundColor: 'white', borderRadius: 0, padding: 0, margin: 0 }}>
                <Icon name={icon} />
              </Button>
              <Label as="a" style={{ backgroundColor: 'white', borderRadius: 0, padding: 0, margin: 0 }}>
                {value}
              </Label>
            </Button>
          ) : (
            roundValue(value)
          )}
        </Table.Cell>
      ))}
    </Table.Row>
  )
}
