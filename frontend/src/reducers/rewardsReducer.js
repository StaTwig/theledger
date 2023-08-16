import { REWARDS_SUCCESS, REWARDS_REQUEST, REWARDS_FAILURE } from "../constants/rewardConstants"
const initialState = {
    data: null,
    loading: false,
    error: null,
};

export const rewardsReducer = (state = initialState, action) => {
    switch (action.type) {
        case REWARDS_REQUEST:
            return { ...state, loading: true, error: null };
        case REWARDS_SUCCESS:
            return { ...state, loading: false, data: action.payload };
        case REWARDS_FAILURE:
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};
