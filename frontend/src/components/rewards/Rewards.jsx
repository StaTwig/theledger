import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Tropy from "../../assets/files/icons/trophy.svg";
import Order from "../../assets/files/icons/order.svg";
import Shipping from "../../assets/files/icons/shipping.svg";
import Lastmile from "../../assets/files/icons/lastmile.svg";
import Cele from "../../assets/files/icons/cele.png";
import Bitcoin from "../../assets/files/icons/bitcoin.svg";
import Bank from "../../assets/files/icons/bank.svg";
import "./Rewards.css";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Redeem from "./redeem/Redeem";
import { getRewards } from "../../actions/rewardActions";

export default function Rewards({ t }) {
  const dispatch = useDispatch();
  const rewards = useSelector((state) => state.rewards);
  const [open, setOpen] = React.useState(false);
  const [RedeemOption, setRedeemOption] = React.useState(null);

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    dispatch(getRewards());
  }, [dispatch]);
  return (
    <>
      <section className='reward_main_layout'>
        <div className='reward_content_area'>
          <div className='reward_price_header'>
            <h1
              style={{ paddingBottom: "10px" }}
              className='vl-heading-bdr black f-700 mi-reset'
            >
              Rewards
            </h1>
          </div>
          <div className='rewards_points_wrapper'>
            <div className='points_banner'>
              <p className='points_message_ts'>Your Points</p>
              {rewards?.loading ? (
                <h1 className='points_score_ts'>Loading ..</h1>
              ) : (
                <h1 className='points_score_ts'>
                  {rewards?.data?.points || 0}
                </h1>
              )}
            </div>
            <div className='points_classification'>
              <h1 className='points_title_ts'>Points Classification</h1>

              <div className='points_classification_list'>
                <div className='points_classification_card'>
                  <div className='point_icon'>
                    <img src={Order} alt='Order' />
                  </div>
                  <div className='point_details'>
                    <h1 className='points_heading_ts'>Order Reward Points</h1>
                    <p className='points_subheading_ts'>
                      Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                      Nesciunt iusto sed.
                    </p>
                  </div>
                  <div className='point_score'>
                    <div className='points_wrap'>
                      <p className='reward_points_ts'>
                        {rewards?.data?.orderRewards || 0}
                      </p>
                      <img src={Tropy} alt='Tropy' />
                    </div>
                  </div>
                </div>
                <div className='points_classification_card'>
                  <div className='point_icon'>
                    <img src={Shipping} alt='Order' />
                  </div>
                  <div className='point_details'>
                    <h1 className='points_heading_ts'>
                      Shipment Reward Points
                    </h1>
                    <p className='points_subheading_ts'>
                      Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                      Nesciunt iusto sed.
                    </p>
                  </div>
                  <div className='point_score'>
                    <div className='points_wrap'>
                      <p className='reward_points_ts'>
                        {rewards?.data?.shipmentRewards || 0}
                      </p>
                      <img src={Tropy} alt='Tropy' />
                    </div>
                  </div>
                </div>
                <div className='points_classification_card'>
                  <div className='point_icon'>
                    <img src={Lastmile} alt='Order' />
                  </div>
                  <div className='point_details'>
                    <h1 className='points_heading_ts'>
                      Last Mile Reward Points
                    </h1>
                    <p className='points_subheading_ts'>
                      Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                      Nesciunt iusto sed.
                    </p>
                  </div>
                  <div className='point_score'>
                    <div className='points_wrap'>
                      <p className='reward_points_ts'>
                        {rewards?.data?.lastMileRewards || 0}
                      </p>
                      <img src={Tropy} alt='Tropy' />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='reward_claim_area'>
          <div className='reward_claim_header'>
            <div className='reward_heading_wrap'>
              <h1 className='reward_title_ts'>Claim Your Rewards</h1>
              <img src={Cele} alt='Cele' />
            </div>
            <p className='points_subtitle_ts'>
              congratulations, Your can redeem your credit points with the
              following options
            </p>
          </div>
          <div className='redeem_option_list'>
            <div className='redeem_option_card'>
              <div className='redeem_icon'>
                <img src={Bank} alt='Bank' />
              </div>
              <div className='redeem_content_space'>
                <div className='redeem_content'>
                  <h1 className='points_heading_ts'>
                    Transfer to Your Bank Account
                  </h1>
                  <p className='points_subheading_ts'>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Nesciunt iusto sed.
                  </p>
                </div>
                <div className='redeem_action'>
                  <button
                    className='mi-btn mi-btn-md mi-btn-secondary'
                    onClick={() => {
                      setOpen(true);
                      setRedeemOption("bank");
                    }}
                  >
                    Redeem to Bank Account
                  </button>
                </div>
              </div>
            </div>
            <div className='redeem_option_card'>
              <div className='redeem_icon'>
                <img src={Bitcoin} alt='Bitcoin' />
              </div>
              <div className='redeem_content_space'>
                <div className='redeem_content'>
                  <h1 className='points_heading_ts'>
                    Convert Into cryptocurrency
                  </h1>
                  <p className='points_subheading_ts'>
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Nesciunt iusto sed.
                  </p>
                </div>
                <div className='redeem_action'>
                  <button
                    className='mi-btn mi-btn-md mi-btn-secondary'
                    onClick={() => {
                      setOpen(true);
                      setRedeemOption("crypto");
                    }}
                  >
                    Buy cryptocurrency
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={open} onClose={handleClose}>
        <DialogContent sx={{ padding: "0 !important" }}>
          <Redeem onClose={handleClose} RedeemOption={RedeemOption} />
        </DialogContent>
      </Dialog>
    </>
  );
}
