import AzureSpeedService from '../services/azureSpeedService';

const getDownloadDataType = 'GET_DOWNLOAD_DATA';

const initialState = { downloadData: {} };

export const actionCreators = {
  getDownloadData: () => async (dispatch, getState) => {
    const downloadData = await AzureSpeedService.getDownloadData();
    dispatch({ type: getDownloadDataType, downloadData });
  }
};

export const reducer = (state = initialState, action) => {

  switch (action.type) {
    case getDownloadDataType:
      return {
        ...state,
        downloadData: action.downloadData
      };
    default:
      return state;
  }
};
