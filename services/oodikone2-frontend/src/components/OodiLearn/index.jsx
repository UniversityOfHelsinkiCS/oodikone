import React from 'react'
import { Segment, Header } from 'semantic-ui-react'
import './oodilearn.css'
import ContentTabs from './ContentTabs'

const OodiLearn = () => (
  <div className="container">
    <Header className="segmentTitle" size="large" content="OodiLearn" />
    <Segment className="contentSegment">
      <ContentTabs />
    </Segment>
  </div>
)

export default OodiLearn
