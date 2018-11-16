import React from 'react'
import { shape } from 'prop-types'

const CourseGradeGraph = ({ data }) => {
    console.log(data)
    return (
        <p>hello</p>
    )
}

CourseGradeGraph.propTypes = {
    data: shape({}).isRequired
}

export default CourseGradeGraph