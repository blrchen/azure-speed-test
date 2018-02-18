function bindThunkActionCreator(actionCreator, dispatch, getState) {
  return (...args) => {
    const result = actionCreator(...args)(dispatch, getState);
    if (result.then) {
      result.then(res => {
        dispatch(res);
      });
    }
    else {
      dispatch(result);
    }
  };
}

export default function bindThunkActionCreators(actionCreators, dispatch, getState) {
  if (typeof actionCreators === 'function') {
    return bindThunkActionCreator(actionCreators, dispatch, getState);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindThunkActionCreators expected an object or a function, instead received ${actionCreators === null ? 'null' : typeof actionCreators}. ` +
      `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    );
  }

  const keys = Object.keys(actionCreators);
  const boundActionCreators = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const actionCreator = actionCreators[key];
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindThunkActionCreator(actionCreator, dispatch, getState);
    }
  }
  return boundActionCreators;
}