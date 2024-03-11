import { bool, func } from 'prop-types'
import React, { useState } from 'react'
import { Table, Icon } from 'semantic-ui-react'

import { courseDataWithRealisationsType } from '@/constants/types'
import './foldableRow.css'

export const FoldableRow = ({ courseData, onClickFn, userHasAccessToAllStats }) => {
  const [isUnfolded, setIsUnfolded] = useState(true)
  const { id, category, realisations } = courseData

  const hasRealisations = realisations.length && realisations.length > 0
  const showCourseRealisations = hasRealisations && isUnfolded

  const getCell = (content, obfuscated) => (
    <Table.Cell content={obfuscated ? '5 or less students' : content} style={{ color: obfuscated && 'gray' }} />
  )

  const getRow = (rowId, rowData, isMainRow = true) => {
    const { passed, failed, passrate, realisation, obfuscated } = rowData
    const showFoldIcon = isMainRow && hasRealisations
    return (
      <Table.Row className={!isMainRow ? 'subRow' : ''} key={rowId}>
        <Table.Cell
          className={showFoldIcon ? 'foldControlCell' : ''}
          onClick={() => isMainRow && setIsUnfolded(isUnfolded => !isUnfolded)}
        >
          {showFoldIcon ? <Icon name={`angle ${isUnfolded ? 'down' : 'right'}`} /> : null}
        </Table.Cell>
        <Table.Cell
          className={isMainRow ? 'courseNameCell' : 'courseRealisationCell'}
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
          onClick={() => onClickFn(id)}
          style={{ color: obfuscated && 'gray' }}
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

FoldableRow.propTypes = {
  courseData: courseDataWithRealisationsType.isRequired,
  onClickFn: func.isRequired,
  userHasAccessToAllStats: bool.isRequired,
}
