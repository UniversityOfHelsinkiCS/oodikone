import React, { Component, Fragment } from 'react'
import { bool, func } from 'prop-types'
import { Table, Icon } from 'semantic-ui-react'

import { courseDataWithRealisationsType } from '../../../constants/types'
import './foldableRow.css'

class FoldableRow extends Component {
  static propTypes = {
    courseData: courseDataWithRealisationsType.isRequired,
    onClickFn: func.isRequired,
    userHasAccessToAllStats: bool.isRequired,
  }

  state = {
    isUnfolded: true,
  }

  render() {
    const { courseData, onClickFn, userHasAccessToAllStats } = this.props
    const { isUnfolded } = this.state
    const { id, category, realisations } = courseData

    const hasRealisations = realisations.length && realisations.length > 0
    const showCourseRealisations = hasRealisations && isUnfolded

    const getCell = (content, obfuscated) => (
      <Table.Cell style={{ color: obfuscated && 'gray' }} content={obfuscated ? '5 or less students' : content} />
    )

    const getRow = (rowId, rowData, isMainRow = true) => {
      const { passed, failed, passrate, realisation, obfuscated } = rowData
      const showFoldIcon = isMainRow && hasRealisations
      return (
        <Table.Row key={rowId} className={!isMainRow ? 'subRow' : ''}>
          <Table.Cell
            className={showFoldIcon ? 'foldControlCell' : ''}
            onClick={() => isMainRow && this.setState({ isUnfolded: !isUnfolded })}
          >
            {showFoldIcon ? <Icon name={`angle ${isUnfolded ? 'down' : 'right'}`} /> : null}
          </Table.Cell>
          <Table.Cell
            content={
              isMainRow ? (
                <>
                  {category}
                  {!userHasAccessToAllStats && <strong>*</strong>} <span>{id}</span>
                </>
              ) : (
                realisation
              )
            }
            style={{ color: obfuscated && 'gray' }}
            className={isMainRow ? 'courseNameCell' : 'courseRealisationCell'}
            onClick={() => onClickFn(id)}
          />
          {getCell(passed, obfuscated)}
          {getCell(failed, obfuscated)}
          {getCell(`${passrate || 0} %`, obfuscated)}
        </Table.Row>
      )
    }

    return (
      <>
        {getRow(id, courseData)}
        {showCourseRealisations
          ? realisations.map(r => {
              const { realisation } = r
              const realisationId = `${id}-${realisation}`
              return getRow(realisationId, r, false)
            })
          : null}
      </>
    )
  }
}

export default FoldableRow
