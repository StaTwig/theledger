import React from "react";
import ProductsTable from './products';
import updownArrow from "../../assets/icons/up-and-down-dark.svg";
import './style.scss';

const productTableData = {
  tableHeader: ['Name One', 'name Two', 'Name Three']
}

const PurchaseForm = () => {
  return (
    <div className="purchaseform">
      <div className="row">
        <div className="col mr-3">
        <div className="input-group">
            <label htmlFor="shipmentId">Supplier</label>
            <input type="text" className="form-control" placeholder="Select Supplier" />
            <div className="input-group-append">
              <img src={updownArrow} alt="downarrow" width="16" height="16" />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="shipmentId">Delievery To</label>
            <input type="text" className="form-control" placeholder="Select Person" />
            <div className="input-group-append">
              <img src={updownArrow} alt="downarrow" width="16" height="16" />
            </div>
          </div>
          </div>
        <div className="col mr-3">
         <div className="input-group">
            <label htmlFor="shipmentId">Delivery Location</label>
            <input type="text" className="form-control" placeholder="Select Delivery Location" />
            <div className="input-group-append">
              <img src={updownArrow} alt="downarrow" width="16" height="16" />
            </div>
          </div>
         </div>
         <div className="col">
         <div className="date">
            Date: 25/03/2020
          </div>
         </div>
         
      </div>
      <hr />
      <ProductsTable {...productTableData}/>
      <button className="btn btn-white shadow-radius font-bold">
        +<span> Add Another Product</span>
      </button>

      <button className="btn btn-orange fontSize20 font-bold">
    <span>REVIEW</span>
        </button>
    </div>
  );
};

export default PurchaseForm;

