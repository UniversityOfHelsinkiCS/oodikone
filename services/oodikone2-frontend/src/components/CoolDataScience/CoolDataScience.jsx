import React from 'react'

import ProtoC from './ProtoC'
import ProtoC2 from './ProtoC2'
import ProtoG from './ProtoG'

import './CoolDataScience.css'

const CoolDataScience = () => {
  return (
    <div style={{ margin: '0 auto', maxWidth: '75vw' }}>
      <ProtoC />
      <ProtoC />
      <ProtoC2 />
      <ProtoC2 />
      <hr />
      <ProtoG />
      <ProtoG />
    </div>
  )
}

export default CoolDataScience
