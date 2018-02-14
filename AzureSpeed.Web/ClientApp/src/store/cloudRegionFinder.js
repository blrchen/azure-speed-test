import AzureSpeedService from '../services/azureSpeedService';

const getRegionByIpOrUrlType = 'GET_REGION';

const initialState = { ipRangeData: {} };

export const actionCreators = {
  getRegionByIpOrUrl: (urlOrIp) => async (dispatch, getState) => {
    const region = await AzureSpeedService.getRegionByIpOrUrl();
    dispatch({ type: getRegionByIpOrUrlType, region });
  }
};

export const reducer = (state = initialState, action) => {

  switch (action.type) {
    case getRegionByIpOrUrlType:
      return {
        ...state,
        region: action.region
      };
    default:
      return state;
  }
};
