import React, { Component, Fragment } from 'react'
import { func } from 'prop-types'
import { Table, Icon } from 'semantic-ui-react'

import { courseDataWithRealisationsType } from '../../../constants/types'
import styles from './foldableRow.css'

class FoldableRow extends Component {
  static propTypes = {
    courseData: courseDataWithRealisationsType.isRequired,
    onClickFn: func.isRequired
  }

  state = {
    isUnfolded: true
  }

  render() {
    const { courseData, onClickFn } = this.props
    const { isUnfolded } = this.state
    const { id, category, realisations } = courseData

    const hasRealisations = realisations.length && realisations.length > 0
    const showCourseRealisations = hasRealisations && isUnfolded

    const getCell = content => (<Table.Cell content={content} />)

    const getRow = (rowId, rowData, isMainRow = true) => {
      const { passed, failed, passrate, realisation } = rowData
      const showFoldIcon = isMainRow && hasRealisations
      return (
        <Table.Row key={rowId} className={!isMainRow ? styles.subRow : ''}>
          <Table.Cell
            className={showFoldIcon ? styles.foldControlCell : ''}
            onClick={() => isMainRow && this.setState({ isUnfolded: !isUnfolded })}
          >{showFoldIcon ? <Icon name={`angle ${isUnfolded ? 'down' : 'right'}`} /> : null}
          </Table.Cell>
          <Table.Cell
            content={isMainRow ? category : realisation}
            className={isMainRow ? styles.courseNameCell : styles.courseRealisationCell}
            onClick={() => onClickFn(id)}
          />
          {getCell(passed)}
          {getCell(failed)}
          {getCell(`${passrate || 0} %`)}
        </Table.Row>
      )
    }

    return (
      <Fragment>
        {getRow(id, courseData)}
        {showCourseRealisations
          ? realisations.map((r) => {
            const { realisation } = r
            const realisationId = `${id}-${realisation}`
            return getRow(realisationId, r, false)
        })
          : null}
      </Fragment>
    )
  }
}

export default FoldableRow
