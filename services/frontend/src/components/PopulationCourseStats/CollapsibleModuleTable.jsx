import React from 'react'
import { Table, Icon } from 'semantic-ui-react'
import { func, arrayOf, object, number, instanceOf } from 'prop-types'
import useLanguage from '../LanguagePicker/useLanguage'

const CollapsibleModuleTable = ({ modules, emptyColSpan, children, expandedGroups, toggleGroupExpansion }) => {
  const { getTextIn } = useLanguage()

  if (!modules) return null

  return (
    <>
      {modules.map(({ module, courses }) => (
        <React.Fragment key={module.code}>
          <Table.Row>
            <Table.Cell
              colSpan="3"
              style={{ cursor: 'pointer' }}
              onClick={() => toggleGroupExpansion(module.code)}
              data-cy={`expand-${module.code}`}
            >
              <Icon name={expandedGroups.has(module.code) ? 'angle down' : 'angle right'} />
              <b>{getTextIn(module.name)}</b>
            </Table.Cell>
            <Table.Cell>
              <b>{module.code}</b>
            </Table.Cell>
            <Table.Cell colSpan={emptyColSpan} />
          </Table.Row>
          {expandedGroups.has(module.code) && children(courses)}
        </React.Fragment>
      ))}
    </>
  )
}

CollapsibleModuleTable.propTypes = {
  modules: arrayOf(object).isRequired,
  children: func.isRequired,
  emptyColSpan: number.isRequired,
  expandedGroups: instanceOf(Set).isRequired,
  toggleGroupExpansion: func.isRequired,
}

export default CollapsibleModuleTable
