import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actionCreators } from '../../store/latency';

import './latency.css';

class Latency extends Component {

  constructor(props) {
    super(props);
    this.state = {
      latencyData: [],
      historyData: []
    };
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.props.getLatencyData().then(() => {
        this.setState({ latencyData: this.props.latencyData });
        Object.keys(this.state.latencyData).map((key, idx) => {
          var data = this.state.latencyData[key];
          var tmp = this.state.historyData;
          if (!tmp[data.data.region]) {
            tmp[data.data.region] = [];
          }
          tmp[data.data.region].push(data.data.latency);
          this.setState({ historyData: tmp });
        });
        console.log(this.state.latencyData);
        console.log(this.state.historyData);
      }
      );
    }, 3000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return (
      <div className="container-fluid" ng-controller="UploadLargeFileController">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Region</th>
              <th>Latency</th>
            </tr>
          </thead>
          <tbody>
            {
              Object.keys(this.state.latencyData).map((key, idx) => {
                var data = this.state.latencyData[key];
                return (
                  <tr>
                    <td>{data.data.region}</td>
                    <td>{data.data.latency}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Region</th>
              <th>Latency</th>
            </tr>
          </thead>
          <tbody>
            {
              Object.keys(this.state.historyData).map((key, idx) => {
                var data = this.state.historyData[key];
                return (
                  <tr>
                    <td>{key}</td>
                    <td>{data}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    );
  }
}

export default connect(
  state => state.latency,
  actionCreators
)(Latency);