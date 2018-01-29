import React, { Component } from 'react';


class CourseStatistics extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <pre>{JSON.stringify(this.props.selectedCourse)}</pre>
        );
    }

}

export default CourseStatistics;
