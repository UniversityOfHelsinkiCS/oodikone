import React from 'react'
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

export default BasicRow
