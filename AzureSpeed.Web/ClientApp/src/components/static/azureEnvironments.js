import React from 'react';
import { connect } from 'react-redux';

const AzureEnvironments = props => (
  <div class="container-fluid">
    <div class="page-header">
      <h3>Azure Environments</h3>
      <small>Difference between Azure cloud and national clouds</small>
    </div>
    <div class="row">
      <div class="col-md-12">
        <div class="panel panel-default">
          <div class="panel-heading">
            Azure Environments
          </div>
          <div class="panel-body">
            <table class="table table-bordered table-striped">
              <thead>
                <tr>
                  <th></th>
                  <th>AzureCloud</th>
                  <th>AzureUSGovernment</th>
                  <th>AzureGermanCloud</th>
                  <th>AzureChinaCloud</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>ActiveDirectoryServiceEndpointResourceId</strong></td>
                  <td>https://management.core.windows.net/</td>
                  <td>https://management.core.usgovcloudapi.net/</td>
                  <td>https://management.core.cloudapi.de/</td>
                  <td>https://management.core.chinacloudapi.cn/</td>
                </tr>
                <tr>
                  <td><strong>GalleryUrl</strong></td>
                  <td>https://gallery.azure.com/</td>
                  <td>https://gallery.azure.com/</td>
                  <td>https://gallery.azure.com/</td>
                  <td>https://gallery.azure.com/</td>
                </tr>
                <tr>
                  <td><strong>ManagementPortalUrl</strong></td>
                  <td>http://go.microsoft.com/fwlink/?LinkId=254433</td>
                  <td>https://manage.windowsazure.us</td>
                  <td>http://portal.microsoftazure.de/</td>
                  <td>http://go.microsoft.com/fwlink/?LinkId=301902</td>
                </tr>
                <tr>
                  <td><strong>ServiceManagementUrl</strong></td>
                  <td>https://management.core.windows.net/</td>
                  <td>https://management.core.usgovcloudapi.net/</td>
                  <td>https://management.core.cloudapi.de/</td>
                  <td>https://management.core.chinacloudapi.cn/</td>
                </tr>
                <tr>
                  <td><strong>PublishSettingsFileUrl</strong></td>
                  <td>http://go.microsoft.com/fwlink/?LinkID=301775</td>
                  <td>https://manage.windowsazure.us/publishsettings/index</td>
                  <td>https://manage.microsoftazure.de/publishsettings/index</td>
                  <td>http://go.microsoft.com/fwlink/?LinkID=301776</td>
                </tr>
                <tr>
                  <td><strong>ResourceManagerUrl</strong></td>
                  <td>https://management.azure.com/</td>
                  <td>https://management.usgovcloudapi.net/</td>
                  <td>https://management.microsoftazure.de/</td>
                  <td>https://management.chinacloudapi.cn/</td>
                </tr>
                <tr>
                  <td><strong>SqlDatabaseDnsSuffix</strong></td>
                  <td>.database.windows.net</td>
                  <td>.database.usgovcloudapi.net</td>
                  <td>.database.cloudapi.de</td>
                  <td>.database.chinacloudapi.cn</td>
                </tr>
                <tr>
                  <td><strong>StorageEndpointSuffix</strong></td>
                  <td>core.windows.net</td>
                  <td>core.usgovcloudapi.net</td>
                  <td>core.cloudapi.de</td>
                  <td>core.chinacloudapi.cn</td>
                </tr>
                <tr>
                  <td><strong>ActiveDirectoryAuthority</strong></td>
                  <td>https://login.microsoftonline.com/</td>
                  <td>https://login-us.microsoftonline.com/</td>
                  <td>https://login.microsoftonline.de/</td>
                  <td>https://login.chinacloudapi.cn/</td>
                </tr>
                <tr>
                  <td><strong>GraphUrl</strong></td>
                  <td>https://graph.windows.net/</td>
                  <td>https://graph.windows.net/</td>
                  <td>https://graph.cloudapi.de/</td>
                  <td>https://graph.chinacloudapi.cn/</td>
                </tr>
                <tr>
                  <td><strong>TrafficManagerDnsSuffix</strong></td>
                  <td>trafficmanager.net</td>
                  <td>usgovtrafficmanager.net</td>
                  <td>azuretrafficmanager.de</td>
                  <td>trafficmanager.cn</td>
                </tr>
                <tr>
                  <td><strong>AzureKeyVaultDnsSuffix</strong></td>
                  <td>vault.azure.net</td>
                  <td>vault.usgovcloudapi.net</td>
                  <td>vault.microsoftazure.de</td>
                  <td>vault.azure.cn</td>
                </tr>
                <tr>
                  <td><strong>AzureKeyVaultServiceEndpointResourceId</strong></td>
                  <td>https://vault.azure.net</td>
                  <td>https://vault.usgovcloudapi.net</td>
                  <td>https://vault.microsoftazure.de</td>
                  <td>https://vault.azure.cn</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <h3>References</h3>
        <p>
          <ul>
            <li>
              <a href="https://docs.microsoft.com/en-us/azure/azure-government/documentation-government-developer-guide" target="_blank" rel="noopener noreferrer">
                Azure Government developer guide</a>
            </li>
          </ul>
        </p>
      </div>
    </div>
  </div>
);

export default connect()(AzureEnvironments);
