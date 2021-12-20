import React, { useState } from "react";
import "./style.scss";
import { isAuthenticated } from '../../utils/commonHelper';

const Tabs = props => {
  return (
    <div className="tabs">
      <ul className="nav nav-pills">
        {isAuthenticated('viewOutboundOrders') &&
          <li className={props.visible === "one" ? "nav-item-active" : "nav-item"} onClick={() => { props.setvisible('one'); props.setShowExportFilter(false) }}>
            <a className={props.visible === "one" ? "nav-link" : "nav-link text-secondary"}>Orders Sent</a>
          </li>
        }
        {isAuthenticated('viewInboundOrders') &&
          <li className={props.visible === "two" ? "nav-item-active " : "nav-item"} onClick={() => { props.setvisible('two'); props.setShowExportFilter(false) }}>
            <a className={props.visible === "two" ? "nav-link" : "nav-link text-secondary"}>Orders Received</a>
          </li>
        }
      </ul>
    </div>
  );
};

export default Tabs;
