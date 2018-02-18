import AzureSpeedService from '../services/azureSpeedService';

const getUploadDataType = 'GET_UPLOAD_DATA';

const initialState = { uploadData: {} };

export const actionCreators = {
  getUploadData: () => async (dispatch, getState) => {
    const uploadData = await AzureSpeedService.getUploadData();
    dispatch({ type: getUploadDataType, uploadData });
  }
};

export const reducer = (state = initialState, action) => {

  switch (action.type) {
    case getUploadDataType:
      return {
        ...state,
        uploadData: action.uploadData
      };
    default:
      return state;
  }
};
