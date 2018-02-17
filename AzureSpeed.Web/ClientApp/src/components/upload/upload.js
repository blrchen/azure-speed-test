import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actionCreators } from '../../store/upload';

import './upload.css';

class Upload extends Component {

  componentDidMount() {
    this.props.getUploadData().then(() => {
      console.log('aaaaaaaaaaaaaaaaaaa');
    });
  }

  render() {
    var result = {};
    return (
      <div class="container-fluid" ng-controller="UploadController">
        <div class="page-header">
          <h3>Azure Storage Blob Upload Speed Test</h3>
          <small>Test upload speed to Azure Storage Service around the world.</small>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="panel panel-default">
              <div class="panel-heading">
                Upload Speed Test
              </div>
              <div class="panel-body">
                <div class="panel-body">
                  <p>
                    <button class="btn btn-success">Start Upload Speed Test >></button>
                  </p>
                  <p>
                    <table class="table table-bordered table-striped" id="upload-table">
                      <thead>
                        <tr>
                          <th>Geography</th>
                          <th>Region</th>
                          <th>Location</th>
                          <th>Upload Progress</th>
                          <th>Upload Speed</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr ng-repeat="result in results">
                          <td>{result.geo}</td>
                          <td>{result.region}</td>
                          <td>{result.location}</td>
                          <td>
                            <div class="progress">
                              <div class="progress-bar progress-bar-info" ng-style="{'width':result.progressPercent+'%'}">{result.progressPercent}%</div>
                            </div>
                          </td>
                          <td>{result.speed}</td>
                        </tr>
                      </tbody>
                    </table>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  state => state.upload,
  actionCreators
)(Upload);