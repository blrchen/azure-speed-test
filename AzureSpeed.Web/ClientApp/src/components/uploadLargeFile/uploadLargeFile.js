import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actionCreators } from '../../store/uploadLargeFile';
import { Modal, Button, ProgressBar } from 'react-bootstrap';
import utils from '../../common/utilities';

import './upload.css';

class UploadLargeFile extends Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      thread: 1,
      blockSize: 4096 * 1024,
      showUploadModal: false,
      progressNow: 0,
      results: []
    };
  }

  closeUploadModal = () => {
    this.setState({ showUploadModal: false });
  }

  showUploadModal = () => {
    this.setState({ showUploadModal: true });
  }

  upload = () => {
    var file = this.fileInput.files[0];
    var fileName = file.name;
    var fileSize = utils.getSizeStr(file.size);
    console.log(this.state);
    var region = 'China East';
    var operation = 'upload';
    this.props.getUploadLargeFileData(region, utils.newGuid(), operation).then(() => {
      console.log(this.props);
      var url = this.props.uploadLargeFileData.url;
      var ja = window.jAzure;
      ja.storage.blockSize = this.state.blockSize;//4 * 1024 * 1024;
      ja.storage.maxThread = this.state.thread;
      var blob = ja.storage.blob(url);
      var st = new Date();
      var before = () => {
        console.log('before');
        this.setState({ progressNow: 0 });
      };
      var progress = (ev) => {
        console.log('progress');
        var progressNow = ((ev.loaded / ev.total) * 100).toFixed(0);
        console.log(progressNow);
        this.setState({ progressNow: progressNow });
      };
      var success = () => {
        var elapsedSeconds = (new Date() - st) / 1000;
        var speed = utils.getSizeStr(fileSize / elapsedSeconds) + '/s';
        var message = 'upload time = ' + elapsedSeconds + 's, speed = ' + speed;
        console.log(message);

        var results = this.state.results;
        results.push({
          fileName: fileName,
          fileSize: fileSize,
          // region: selectedRegion.name,
          blockSize: this.state.blockSize,
          thread: this.state.thread,
          speed: speed
        });
        this.setState({ results: results });
        console.log(elapsedSeconds);
        console.log('success');
      };
      var error = function (err) {
        // $scope.error = err;
        console.log('error');
      };
      blob.upload(file, before, progress, success, error);
    });
  }

  componentDidMount() {
  }

  componentWillMount() {

  }

  render() {
    const blockSizes = [
      { name: 128, value: 256 },
      { name: 1024, value: 1024 },
      { name: 4096, value: 4096 }
    ];
    const threads = [
      { name: 1, value: 1 },
      { name: 2, value: 2 },
      { name: 3, value: 4 }
    ];
    return (
      <div className="container-fluid" ng-controller="UploadLargeFileController">
        <div className="page-header">
          <h3>Azure Storage Large File Upload Speed Test</h3>
          <small>Test upload large file to Azure Blob Storage in worldwide datacenters</small>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="panel panel-default">
              <div className="panel-heading">
                File Upload Speed Test
              </div>
              <div className="panel-body">
                <Button bsStyle="primary" bsSize="large" onClick={this.showUploadModal}>
                  Launch Testing Modal
                </Button>
                <p>
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>File Size</th>
                        <th>Region</th>
                        <th>Block Size(kb)</th>
                        <th>Thread</th>
                        <th>Upload Speed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        Object.keys(this.state.results).map((key, idx) => {
                          var result = this.state.results[key];
                          return (
                            <tr>
                              <td>{result.fileName}</td>
                              <td>{result.fileSize}</td>
                              <td>{result.region}</td>
                              <td>{result.blockSize}</td>
                              <td>{result.thread}</td>
                              <td>{result.speed}</td>
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                </p>
              </div>
            </div>
          </div>
        </div>
        <Modal show={this.state.showUploadModal} onHide={this.closeUploadModal}>
          <Modal.Header closeButton>
            <Modal.Title>Upload File</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="modal-body form-horizontal">
              <form>
                <div className="form-group">
                  <label className="control-label col-md-4">File</label>
                  <div className="col-md-6">
                    <input type="file" ref={input => { this.fileInput = input; }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="control-label col-md-4">Region</label>
                  <div className="col-md-6">
                    <select className="form-control" ng-options="region.name for region in regions" ng-model="selectedRegion" required>
                      <option value="">--Please select--</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="control-label col-md-4">Block Size(kb)</label>
                  <div className="col-md-6">
                    <select className="form-control" onChange={ (event) => { this.setState({ blockSize: event.target.value }); }}>
                      <option>--Please select--</option>
                      {
                        blockSizes.map((s) => <option key={s.name} value={s.value} >{s.name}</option>)
                      }
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="control-label col-md-4">Thread</label>
                  <div className="col-md-6">
                    <select className="form-control" onChange={(event) => { this.setState({ blockSize: event.target.value }); }}>
                      <option>--Please select--</option>
                      {
                        threads.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)
                      }
                    </select>
                  </div>
                </div>
                <div>{this.state.progressPercent}</div>
                <ProgressBar bsStyle="success" now={this.state.progressNow} label={`$(this.state.progressNow)%`} />
                {/* <div className="alert alert-success" ng-if="progressPercent > 0">file=fileName, size=fileSize, message</div>
                <div className="alert alert-danger" ng-if="error">error</div> */}
              </form>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="col-xs-6">
              <Button className="btn btn-success btn-block" onClick={this.upload} ng-disabled="!canUpload()">Upload</Button>
            </div>
            <div className="col-xs-6">
              <Button className="btn btn-default btn-block" onClick={this.closeUploadModal}>Close</Button>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default connect(
  state => state.uploadLargeFile,
  actionCreators
)(UploadLargeFile);