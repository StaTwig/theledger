import {
  AUTH_SUCCESS,
  AUTH_ERROR,
  PROFILE_SUCCESS,
} from "../constants/userConstants";

export const initialState = null;

export const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case AUTH_SUCCESS:
    case PROFILE_SUCCESS:
      return {
        ...state,
        ...action.payload,
      };
    case AUTH_ERROR:
      return initialState;
    default:
      return state;
  }
};
