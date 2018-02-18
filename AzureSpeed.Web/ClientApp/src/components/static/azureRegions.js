import React from 'react';
import { connect } from 'react-redux';

const AzureRegions = props => (
  <div class="container-fluid">
    <div class="page-header">
      <h3>Azure Regions</h3>
      <small>Azure operates in multiple geographies around the world. An Azure geography is a defined area of the world that contains at least one Azure Region. An Azure region is an area within a geography containing one or more datacenters. Each Azure region is paired with another region within the same geography, together making a regional pair</small>
    </div>
    <div class="row">
      <div class="col-md-12">
        <div class="panel panel-default">
          <div class="panel-heading">
            Azure Regions
          </div>
          <div class="panel-body">
            <table class="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Geography</th>
                  <th>Region</th>
                  <th>Location</th>
                  <th>Paired Region</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>America</td><td>West US</td><td>California</td><td>East US</td></tr>
                <tr><td>America</td><td>East US</td><td>Virginia</td><td>West US</td></tr>
                <tr><td>America</td><td>East US 2</td><td>Virginia</td><td>Central US</td></tr>
                <tr><td>America</td><td>North Central US</td><td>Illinois</td><td>South Central US</td></tr>
                <tr><td>America</td><td>West US 2</td><td>West US 2</td><td>West Central US</td></tr>
                <tr><td>America</td><td>South Central US</td><td>Texas</td><td>Brazil South</td></tr>
                <tr><td>America</td><td>Central US</td><td>Iowa</td><td>East US 2</td></tr>
                <tr><td>Europe</td><td>West Europe</td><td>Netherlands</td><td>North Europe</td></tr>
                <tr><td>Europe</td><td>North Europe</td><td>Ireland</td><td>West Europe</td></tr>
                <tr><td>Asia</td><td>East Asia</td><td>Hong Kong</td><td>Southeast Asia</td></tr>
                <tr><td>Asia</td><td>Southeast Asia</td><td>Singapore</td><td>East Asia</td></tr>
                <tr><td>Asia</td><td>Japan East</td><td>Saitama Prefecture</td><td>Japan West</td></tr>
                <tr><td>Asia</td><td>Japan West</td><td>Osaka Prefecture</td><td>Japan East</td></tr>
                <tr><td>America</td><td>Brazil South</td><td>Sao Paulo State</td><td>South Central US</td></tr>
                <tr><td>Asia</td><td>Australia East</td><td>New South Wales</td><td>Australia Southeast</td></tr>
                <tr><td>Asia</td><td>Australia Southeast</td><td>Victoria</td><td>Australia East</td></tr>
                <tr><td>Asia</td><td>South India</td><td>Chennai</td><td>West India,Central India</td></tr>
                <tr><td>Asia</td><td>West India</td><td>Mumbai</td><td>South India,Central India</td></tr>
                <tr><td>Asia</td><td>Central India</td><td>Pune</td><td>West India,South India</td></tr>
                <tr><td>America</td><td>Canada Central</td><td>Toronto</td><td>Canada East</td></tr>
                <tr><td>America</td><td>Canada East</td><td>Quebec City</td><td>Canada Central</td></tr>
                <tr><td>America</td><td>West Central US</td><td>West Central US</td><td>West US 2</td></tr>
                <tr><td>Europe</td><td>UK West</td><td>Cardiff</td><td>UK South</td></tr>
                <tr><td>Europe</td><td>UK South</td><td>London</td><td>UK West</td></tr>
                <tr><td>Asia</td><td>Korea South</td><td>Busan</td><td>Korea Central</td></tr>
                <tr><td>Asia</td><td>Korea Central</td><td>Seoul</td><td>Korea South</td></tr>
                <tr><td>Asia</td><td>China East</td><td>Shanghai</td><td>China North</td></tr>
                <tr><td>Asia</td><td>China North</td><td>Beijing</td><td>China East</td></tr>
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
              <a href="https://docs.microsoft.com/en-us/azure/best-practices-availability-paired-regions" target="_blank" rel="noopener noreferrer">
                Business continuity and disaster recovery (BCDR): Azure Paired Regions</a>
            </li>
          </ul>
        </p>
      </div>
    </div>
  </div>
);

export default connect()(AzureRegions);
