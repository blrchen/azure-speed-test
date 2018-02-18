const initializeAppStart = 'INITIALIZE_APP_START';
const initializeAppEnd = 'INITIALIZE_APP_END';
const initialState = { isLoading: false };
export const actionCreators = {
  initializeApp: () => async (dispatch, getState) => {
    dispatch({ type: initializeAppStart });
    dispatch({ type: initializeAppEnd });
  }
};

export const reducer = (state = initialState, action) => {

  switch (action.type) {
    case initializeAppStart:
      return {
        ...state,
        isLoading: true
      };
    case initializeAppEnd:
      return {
        ...state,
        isLoading: false
      };
    default:
      return state;
  }
};