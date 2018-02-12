import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { isFunction } from '../../common/utilities';

import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';
import './grid.css';

const ROW_HEIGHT = 32;

/**
 * Grid is a helper wrapper around AgGrid. The primary functionality of this wrapper
 * is to allow easy reuse of the grid theme. To see params, read the AgGrid docs.
 *
 * Props:
 *  getSoftSelectId: A method that when provided with the a row data object returns an id for that object
 *  softSelectId: The ID of the row data to be soft selected
 *  onHardSelectChange: Fires when rows are hard selected
 *  onSoftSelectChange: Fires when a row is soft selected
 */
export default class Grid extends Component {

  constructor(props) {
    super(props);
    this.state = { currentSoftSelectId: '' };

    this.defaultGridProps = {
      suppressCellSelection: true,
      suppressClickEdit: true,
      suppressRowClickSelection: true, // Suppress so that a row is only selectable by checking the checkbox
      suppressLoadingOverlay: true,
      suppressNoRowsOverlay: true
    };
  }

  /** When new props are passed in, check if the soft select state needs to be updated */
  componentWillReceiveProps(nextProps) {
    if (this.currentSoftSelectId !== nextProps.softSelectId) {
      this.setState({ currentSoftSelectId: nextProps.softSelectId }, this.refreshRows);
    }
  }

  /** Save the gridApi locally on load */
  onGridReady = gridReadyEvent => {
    this.gridApi = gridReadyEvent.api;
    if (isFunction(this.props.onGridReady)) {
      this.props.onGridReady(gridReadyEvent);
    }
  }

  /** Refreshes the grid to update soft select CSS states */
  refreshRows = () => {
    if (this.gridApi && this.gridApi.rowRenderer && this.gridApi.rowRenderer.refreshRows) {
      this.gridApi.rowRenderer.refreshRows(this.gridApi.getRenderedNodes());
    }
  };

  /** Computes the CSS classes to apply to each row, including soft select */
  getRowClass = params => {
    let rowClasses = '';
    if (isFunction(this.props.getSoftSelectId)) {
      rowClasses = this.props.getSoftSelectId(params.data) === this.props.softSelectId ? 'pcs-row-soft-selected' : '';
    }
    if (isFunction(this.props.getRowClass)) {
      rowClasses += ` ${this.props.getRowClass(params)}`;
    }
    return rowClasses;
  }

  /** When a row is hard selected, try to fire a hard select event, plus any props callbacks */
  onSelectionChanged = () => {
    const { onHardSelectChange, onSelectionChanged } = this.props;
    if (isFunction(onHardSelectChange)) {
      onHardSelectChange(this.gridApi.getSelectedRows());
    }
    if (isFunction(onSelectionChanged)) {
      onSelectionChanged();
    }
  };

  /** When a row is selected, try to fire a soft select event, plus any props callbacks */
  onRowClicked = rowEvent => {
    const { onSoftSelectChange, onRowClicked } = this.props;
    if (isFunction(onSoftSelectChange)) onSoftSelectChange(rowEvent.data, rowEvent);
    if (isFunction(onRowClicked)) onRowClicked(rowEvent.data);
  };

  onRowDoubleClicked = rowEvent => {
    const { onRowDoubleClicked } = this.props;
    if (isFunction(onRowDoubleClicked)) onRowDoubleClicked(rowEvent);
  };

  render() {
    const gridParams = {
      ...this.defaultGridProps,
      ...this.props,
      headerHeight: ROW_HEIGHT,
      rowHeight: ROW_HEIGHT,
      getRowClass: this.getRowClass,
      onGridReady: this.onGridReady,
      onSelectionChanged: this.onSelectionChanged,
      onRowClicked: this.onRowClicked,
      onRowDoubleClicked: this.onRowDoubleClicked
    };

    return (
      <div className={"grid-container ag-theme-fresh " + this.props.className}>
        <AgGridReact {...gridParams} />
      </div>
    );
  }
}
