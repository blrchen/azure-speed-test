import AzureSpeedService from '../services/azureSpeedService';

const getIpRangeDataType = 'GET_IP_RANGE_DATA';

const initialState = { ipRangeData: {} };

export const actionCreators = {
  getIpRangeData: () => async (dispatch, getState) => {
    console.log('in getIpRangeData');
    const ipRangeData = await AzureSpeedService.getIpRageData();
    console.log(ipRangeData);
    dispatch({ type: getIpRangeDataType, ipRangeData });
  }
};

export const reducer = (state = initialState, action) => {

  switch (action.type) {
    case getIpRangeDataType:
      return {
        ...state,
        ipRangeData: action.ipRangeData
      };
    default:
      return state;
  }
};
