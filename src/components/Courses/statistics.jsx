import React, { Component } from 'react';


class CourseStatistics extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div>
            <pre>{JSON.stringify(this.props.selectedCourse)}</pre>
            <pre>{JSON.stringify(this.props.stats, null, 2)}</pre>
            </div>
        );
    }

}

export default CourseStatistics;
