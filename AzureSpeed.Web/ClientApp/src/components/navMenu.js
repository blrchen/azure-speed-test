import React from 'react';
import { Link } from 'react-router-dom';
import { Glyphicon, Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import './navMenu.css';

export default props => (
  <Navbar inverse fixedTop fluid collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <Link to={'/'}>AzureSpeed.com</Link>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        <LinkContainer to={'/'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> Latency Test
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> Upload Speed Test
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> Large File Upload Speed Test
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> Download Speed Test
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> PsPing Latency Test
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> Cloud Region Finder
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> Azure Regions
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> Azure Environments
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> Azure Billing Meters
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> Datacenter IP Ranges
          </NavItem>
        </LinkContainer>
      </Nav>
      <Nav>
        <LinkContainer to={'/about'} exact>
          <NavItem>
            <Glyphicon glyph='home' /> About
          </NavItem>
        </LinkContainer>
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);