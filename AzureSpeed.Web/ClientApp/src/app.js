import React from 'react';
import { Route } from 'react-router';
import Layout from './components/layout';
import Counter from './components/counter';
import PsPing from './components/static/psping';
import AzureRegions from './components/static/azureRegions';
import AzureEnvironments from './components/static/azureEnvironments';
import AzureBillingMeters from './components/static/azureBillingMeters';
import IpRange from './components/ipRange/ipRange';
import Reference from './components/static/reference';
import About from './components/static/about';

export default () => (
  <Layout>
    <Route exact path='/' component={Counter} />
    <Route path='/latency' component={Counter} />
    <Route path='/upload' component={Counter} />
    <Route path='/uploadLargeFile' component={Counter} />
    <Route path='/download' component={Counter} />
    <Route path='/psping' component={PsPing} />
    <Route path='/cloudRegionFinlder' component={Counter} />
    <Route path='/azureRegions' component={AzureRegions} />
    <Route path='/azureEnvironments' component={AzureEnvironments} />
    <Route path='/azureBillingMeters' component={AzureBillingMeters} />
    <Route path='/ipRange' component={IpRange} />
    <Route path='/reference' component={Reference} />
    <Route path='/about' component={About} />
  </Layout>
);
