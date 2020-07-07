import React, { useState } from 'react'
import { Table, Icon } from 'semantic-ui-react'
import { func, arrayOf, object } from 'prop-types'
import { useLanguage } from '../../common/hooks'
import { getTextIn } from '../../common'

const CollapsibleModuleTable = ({ modules, children }) => {
  const language = useLanguage()
  const [visible, setVisible] = useState([])

  const toggleVisible = code => {
    const newState = !visible[code]
    setVisible({ ...visible, [code]: newState })
  }

  if (!modules) return null

  return (
    <>
      {modules.map(({ module, courses }) => (
        <React.Fragment key={module.code}>
          <Table.Row>
            <Table.Cell style={{ cursor: 'pointer' }} colSpan="3" onClick={() => toggleVisible(module.code)}>
              <Icon name={visible[module.code] ? 'angle down' : 'angle right'} />
              <b>{getTextIn(module.name, language)}</b>
            </Table.Cell>
            <Table.Cell>
              <b>{module.code}</b>
            </Table.Cell>
          </Table.Row>
          {visible[module.code] && children(courses)}
        </React.Fragment>
      ))}
    </>
  )
}

CollapsibleModuleTable.propTypes = {
  modules: arrayOf(object).isRequired,
  children: func.isRequired
}

export default CollapsibleModuleTable
