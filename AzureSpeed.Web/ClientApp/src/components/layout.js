import React from 'react';
import { Col, Grid, Row } from 'react-bootstrap';
import NavMenu from './navMenu';

export default props => (
  <Grid fluid>
    <Row>
      <Col sm={2}>
        <NavMenu />
      </Col>
      <Col sm={10}>
        {props.children}
      </Col>
    </Row>
  </Grid>
);
