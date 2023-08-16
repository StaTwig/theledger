import {
    REWARDS_REQUEST, REWARDS_SUCCESS, REWARDS_FAILURE
} from "../constants/rewardConstants";
import { config } from "../config";
import axios from "axios";

export const getRewards = () => {
    return async (dispatch) => {
        try {
            dispatch(fetchingRewards());
            const result = await axios.get(config().userRewardsUrl);
            dispatch(setRewards({ ...result.data.data }));
            return result;
        } catch (error) {
            console.log(error);
        }
    }
};

export const redeemRewards = async (data, isWalletType) => {
    try {
        if (isWalletType) {
            const body = {
                ...data,
                type: "WALLET"
            }
            await axios.post(config().redeemRewardsUrl, body)
        }
    }
    catch (err) {
        console.log(err)
    }
}

export const setRewards = (data) => {
    return {
        type: REWARDS_SUCCESS,
        payload: data
    }
}

export const errorRewards = (data) => {
    return {
        type: REWARDS_FAILURE,
        payload: data
    }
}

export const fetchingRewards = () => {
    return {
        type: REWARDS_REQUEST,
    }
}