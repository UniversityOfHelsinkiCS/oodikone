import React from 'react';
import PropTypes from 'prop-types';
import { Dimmer, Loader } from 'semantic-ui-react';

const SegmentDimmer = ({ translate, isLoading = false }) => (
  <Dimmer active={isLoading} inverted>
    <Loader>{translate('common.loading')}</Loader>
  </Dimmer>
);
const { func, bool } = PropTypes;

SegmentDimmer.propTypes = {
  translate: func.isRequired,
  isLoading: bool.isRequired
};

export default SegmentDimmer;
