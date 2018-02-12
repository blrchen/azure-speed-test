import React from 'react';
import { Route } from 'react-router';
import Layout from './components/layout';
import Counter from './components/counter';
import About from './components/static/about';

export default () => (
  <Layout>
    <Route exact path='/' component={Counter} />
    <Route path='/latency' component={Counter} />
    <Route path='/upload' component={Counter} />
    <Route path='/uploadLargeFile' component={Counter} />
    <Route path='/download' component={Counter} />
    <Route path='/psping' component={Counter} />
    <Route path='/cloudRegionFinlder' component={Counter} />
    <Route path='/azureRegions' component={Counter} />
    <Route path='/azureEnvironments' component={Counter} />
    <Route path='/azureBillingMeters' component={Counter} />
    <Route path='/ipRange' component={Counter} />
    <Route path='/reference' component={Counter} />
    <Route path='/about' component={About} />
    <Route path='/reference' component={Counter} />
  </Layout>
);
