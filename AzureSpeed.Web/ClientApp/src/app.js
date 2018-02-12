import React from 'react';
import { Route } from 'react-router';
import Layout from './components/layout';
import Counter from './components/counter';
import PsPing from './components/static/psping';
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
    <Route path='/azureRegions' component={Counter} />
    <Route path='/azureEnvironments' component={Counter} />
    <Route path='/azureBillingMeters' component={Counter} />
    <Route path='/ipRange' component={Counter} />
    <Route path='/reference' component={Reference} />
    <Route path='/about' component={About} />
  </Layout>
);
