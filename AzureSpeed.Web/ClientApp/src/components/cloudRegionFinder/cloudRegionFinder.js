import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actionCreators } from '../../store/cloudRegionFinder';

import './cloudRegionFinder.css';

class CloudRegionFinder extends Component {

  componentDidMount() {
    // this.props.getIpRangeData();
  }

  render() {
    return (
      <div class="container-fluid">
        <div class="page-header">
          <h3>Datacenter IP Range</h3>
        </div>
      </div>
    );
  }
}

export default connect(
  state => state.cloudRegionFinder,
  actionCreators
)(CloudRegionFinder);