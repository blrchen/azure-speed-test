import AzureSpeedService from '../services/azureSpeedService';

const getLatencyDataType = 'GET_LATENCY_DATA';

const initialState = { latencyData: [], latency: [] };

var latencyData = [];

export const actionCreators = {
  getLatencyData: (region) => async (dispatch, getState) => {
    var regions = ['azspdchinaeast', 'azspdchinanorth'];
    for (var region of regions) {
      var start = new Date().getTime();
      await AzureSpeedService.getLatencyData(region);
      var end = new Date().getTime();
      var latencyTime = end - start;
      console.log('latency time in loop, region=' + region + ',time=' + latencyTime);

      if (!latencyData[region]) {
        latencyData[region] = {};
      }
      if (!latencyData[region].data) {
        latencyData[region].data = {};
      }
      latencyData[region].data.region = region;
      latencyData[region].data.latency = latencyTime;
    }

    dispatch({ type: getLatencyDataType, latencyData });
  }
};

export const reducer = (state = initialState, action) => {

  switch (action.type) {
    case getLatencyDataType:
      return {
        ...state,
        latencyData: action.latencyData
      };
    default:
      return state;
  }
};
