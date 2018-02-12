const incrementCountType = 'INCREMENT_COUNT';
const decrementCountType = 'DECREMENT_COUNT';
const initialState = { count: 0 };

export const actionCreators = {
  increment: () => ({ type: incrementCountType }),
  decrement: () => ({ type: decrementCountType })
};

export const reducer = (state = initialState, action) => {

  switch(action.type) {
    case incrementCountType:
      return { ...state, count: state.count + 1 };
    case decrementCountType:
      return { ...state, count: state.count - 1 };
    default:
      return state;
  }
};
