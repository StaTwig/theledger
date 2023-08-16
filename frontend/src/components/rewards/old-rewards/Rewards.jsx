import React from "react";
import Reward from "../../assets/files/designs/rewards.png";
import "./Rewards.css";

export default function Rewards({ t }) {
  return (
    <section className='reward_main_layout'>
      <div className='reward_content_area'>
        <div className='reward_header'>
          <h1
            style={{ paddingBottom: "10px" }}
            className='vl-heading-bdr black f-700 mi-reset'
          >
            Rewards
          </h1>
        </div>
        <div className='reward_body'>
          <div className='rewards_wrapper'>
            <div className='rewards_card'>
              <img src={Reward} alt='Reward' />
              <p className='reward_point_counter'>2,000</p>
              <p className='reward_message_ts'>Your Points</p>
            </div>
            <div className='rewards_classification'>
              <div className='reward_points border_added'>
                <p className='reward_heading_ts'>Order Reward Points</p>
                <div className='points_wrap'>
                  <p className='reward_points_ts'> 200</p>
                  <i className='fa-solid fa-medal'></i>
                </div>
              </div>
              <div className='reward_points border_added'>
                <p className='reward_heading_ts'>Shipment Reward Points</p>
                <div className='points_wrap'>
                  <p className='reward_points_ts'> 200</p>
                  <i className='fa-solid fa-medal'></i>
                </div>
              </div>
              <div className='reward_points'>
                <p className='reward_heading_ts'>LastMile Reward Points</p>
                <div className='points_wrap'>
                  <p className='reward_points_ts'> 200</p>
                  <i className='fa-solid fa-medal'></i>
                </div>
              </div>
              <div className='claim_rewards'>
                <div className='claim_headline'>
                  <h1 className='claim_title_ts'>Claim Your Rewards</h1>
                  <p className='claim_subtitle_ts'>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Eius, laudantium!
                  </p>
                </div>
                <div className='claim_actions'>
                  <button className='mi-btn mi-btn-md mi-btn-secondary'>
                    Transfer to Bank
                  </button>
                  <button className='mi-btn mi-btn-md mi-btn-secondary-outline'>
                    Convert to Crypto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
