import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import "./Redeem.css";
import { redeemRewards } from "../../../actions/rewardActions";

export default function Redeem({ onClose, RedeemOption }) {
  const [formData, setFormData] = useState({
    fullName: "",
    emailId: "",
    bandAccNo: "",
    upiId: "",
    walletAddress: null,
  });
  const [formResult, setFormResult] = useState({
    submit: false,
    message: "",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    redeemRewards(formData, formData.walletAddress);
    setFormResult({ submit: true, message: " ✅ Redeem Request Sent" });
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className='redeem_container'>
        <div className='redeem_header'>
          <h1 className='reward_title_ts'>Claim Your Rewards</h1>

          <div className='close_btn' onClick={onClose}>
            <i className='fa-solid fa-xmark'></i>
          </div>
        </div>

        <div className='redeem_body'>
          <p className='points_subtitle_ts'>
            Congratulations, You got your points. Please fill the details to
            redeem your rewards
          </p>
          <TextField
            autoFocus
            margin='dense'
            id='name'
            label='Full Name'
            type='text'
            name='fullName'
            value={formData.fullName}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            margin='dense'
            id='name'
            label='Email Address'
            type='email'
            name='emailId'
            value={formData.emailId}
            onChange={handleInputChange}
            fullWidth
          />
          {RedeemOption === "bank" ? (
            <>
              <TextField
                margin='dense'
                id='name'
                label='Bank Account Number'
                type='text'
                name='bandAccNo'
                value={formData.bandAccNo}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                margin='dense'
                id='name'
                label='UPI ID'
                type='text'
                name='upiId'
                value={formData.upiId}
                onChange={handleInputChange}
                fullWidth
              />
            </>
          ) : (
            <TextField
              margin='dense'
              id='name'
              label='Wallet Address'
              type='text'
              name='walletAddress'
              value={formData.walletAddress}
              onChange={handleInputChange}
              fullWidth
            />
          )}
        </div>
        <div className='redeem_footer'>
          {formResult?.submit ? (
            formResult?.message
          ) : (
            <button className='mi-btn mi-btn-md mi-btn-secondary' type='submit'>
              {RedeemOption === "bank"
                ? "Redeem to Bank Account"
                : "Buy cryptocurrency"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
