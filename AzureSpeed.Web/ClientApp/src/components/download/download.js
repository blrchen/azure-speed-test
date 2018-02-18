import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actionCreators } from '../../store/download';

import './download.css';

class Download extends Component {

  componentDidMount() {
    this.props.getDownloadData();
  }

  render() {
    console.log(this.props);
    return (
      <div class="container-fluid" ng-controller="DownloadController">
        <div class="page-header">
          <h3>Azure Storage Blob Download Speed Test</h3>
          <small>Test download speed from Azure Storage Service around the world.</small>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="panel panel-default">
              <div class="panel-heading">
                Azure Download Speed Test
              </div>
              <div class="panel-body">
                <table class="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>Geography</th>
                      <th>Region</th>
                      <th>Location</th>
                      <th>Test File</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {
                        Object.keys(this.props.downloadData).map((key, idx) => {
                          var data = this.props.downloadData[key];
                          return (
                            <tr>
                              <td>{data.region}</td>
                              <td>
                                <a class="btn btn-default" href="{data.url}">Download 100MB File</a>
                              </td>
                            </tr>
                          );
                        })
                      }
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  state => state.download,
  actionCreators
)(Download);