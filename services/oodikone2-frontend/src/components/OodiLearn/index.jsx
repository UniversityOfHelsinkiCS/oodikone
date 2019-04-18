import React from 'react'
import { Segment, Header } from 'semantic-ui-react'
import sharedStyles from '../../styles/shared'
import style from './oodilearn.css'
import ContentTabs from './ContentTabs'

const OodiLearn = () => (
  <div className={style.container}>
    <Header className={sharedStyles.segmentTitle} size="large" content="OodiLearn" />
    <Segment className={sharedStyles.contentSegment}>
      <ContentTabs />
    </Segment>
  </div>
)

export default OodiLearn
