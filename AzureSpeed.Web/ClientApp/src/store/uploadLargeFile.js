import AzureSpeedService from '../services/azureSpeedService';

const getUploadLargeFileDataType = 'GET_UPLOAD_LARGE_FILE_DATA';

const initialState = { uploadLargeFileData: {} };

export const actionCreators = {
  getUploadLargeFileData: (region, blobName, operation) => async (dispatch, getState) => {
    const uploadLargeFileData = await AzureSpeedService.getUploadLargeFileData(region, blobName, operation);
    dispatch({ type: getUploadLargeFileDataType, uploadLargeFileData });
  }
};

export const reducer = (state = initialState, action) => {

  switch (action.type) {
    case getUploadLargeFileDataType:
      return {
        ...state,
        uploadLargeFileData: action.uploadLargeFileData
      };
    default:
      return state;
  }
};
