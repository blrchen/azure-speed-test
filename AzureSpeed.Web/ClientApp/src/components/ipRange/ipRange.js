import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actionCreators } from '../../store/ipRange';

import './ipRange.css';

class IpRange extends Component {

  componentDidMount() {
    console.log('in componentDidMound');
    this.props.getIpRangeData();
  }

  componentWillMount() {
    console.log('in componentDidMound');
    this.props.getIpRangeData();
  }

  render() {
    console.log(this.props);
    return (
      <div class="container-fluid" ng-controller="IpRangeController">
        <div class="page-header">
          <h3>Datacenter IP Range</h3>
          <small>Some funny data for how many public ip address do Microsoft, AWS and Alibaba owns. If you know ip or url, you can use <a href="~/Cloud/RegionFinder">Cloud Region Finder</a> to find our detail cloud and region info</small>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="panel panel-default">
              <div class="panel-heading">
                Datacenter IP Range
              </div>
              <div class="panel-body">
                <table class="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th width="60">Cloud</th>
                      <th width="100">Region</th>
                      <th width="80">Total IP</th>
                      <th>IP Range Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      Object.keys(this.props.ipRangeData).map((key, idx) => {
                        var data = this.props.ipRangeData[key];
                        return (
                          <tr>
                            <td>{data.cloud}</td>
                            <td>{data.region}</td>
                            <td>{data.totalIpCount}</td>
                            <td>{data.subnet}</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class=" col-md-12">
            <h3>References</h3>
            <div>
              <ul>
                <li>
                  <a href="https://www.microsoft.com/en-us/download/details.aspx?id=41653" target="_blank" rel="noopener noreferrer">
                    Microsoft Azure Datacenter IP Ranges</a>
                </li>
                <li>
                  <a href="https://www.microsoft.com/en-us/download/details.aspx?id=42064" target="_blank" rel="noopener noreferrer">
                    Windows Azure Datacenter IP Ranges in China</a>
                </li>
                <li>
                  <a href="http://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html" target="_blank" rel="noopener noreferrer">
                    AWS IP Address Ranges</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  state => state.ipRange,
  actionCreators
)(IpRange);