import React, { useState } from "react";
import Modal from "../../shared/modal";
import FailPopup from "./failPopup";

function GridRow({ heading, context }) {
  return (
    <div className='ShipmentInfo--grid-column-alt'>
      <p className='info-text-width info-content-text text-secondary'>
        {heading}
      </p>
      <p className='info-content-text'>{context}</p>
    </div>
  );
}

function Product(props) {
	const { t, index, product, deliveredProductList, updateList, setError } = props;
  const [deliveredProduct, setDeliveredProduct] = useState("");
  const [productQuantity, setProductQuantity] = useState("");

	return (
		<div className="ShipmentInfo--main-container-alt">
			<div className="ShipmentInfo--info-wrapper">
				<div className="ShipmentInfo--content-space-2">
					<div className="ShipmentInfo--grid-column-alt">
						<p className="info-text-width productheading">{product.productName}</p>
						<div className="edit-action-div">
							<button
								type="button"
								style={{ width: "3vw", height: "4vh", fontSize: "12px" }}
								onClick={() => {
									let updatedList;
									setDeliveredProduct(productQuantity);
									if (productQuantity <= product.productQuantity) {
										setError(false);
                    props.onQuantityChange(index, productQuantity);
                    updateList(index, productQuantity);
									} else {
										setProductQuantity("");
										setDeliveredProduct("");
										props.onQuantityChange(index, productQuantity);
										setError(true);
                  }
                  updatedList = updateList(index, deliveredProduct);
									props.setDelivered(updatedList);
									props.setIndex(index);
								}}
								className="btn btn-outline-warning mt-2 mr-1 p-1"
							>
								{deliveredProduct ? t("save") : t("edit")}
							</button>
						</div>
					</div>
					<GridRow heading={t("product_name")} context={product.productName} />
					<GridRow heading={t("manufacturer")} context={product.manufacturer} />
					<GridRow
						heading={t("quantity") + " " + t("sent")}
						context={`${product.productQuantity} ${
							product.unitofMeasure && product.unitofMeasure.name
								? `(${product.unitofMeasure.name})`
								: ""
						}`}
					/>
					<div className="ShipmentInfo--grid-column-alt">
						<p className="info-text-width info-content-text text-secondary">
							{t("quantity") + " " + t("received")}
						</p>
						<div className="editing-options">
							{!product["productQuantity"] ? (
								<p className="info-content-text">{product["productQuantityDelivered"]}</p>
							) : (
								<input
									className="form-control quantity-received"
									value={deliveredProductList[index]}
									placeholder={t("enter_qunatity")}
									onChange={(e) => {
                    setProductQuantity(e.target.value);
										setDeliveredProduct(e.target.value);
										if (e.target.value <= product.productQuantity) {
											setError(false);
                      props.onQuantityChange(index, e.target.value);
                      updateList(index, e.target.value);
										} else {
											e.target.value = "";
											setDeliveredProduct("");
											props.onQuantityChange(index, e.target.value);
											setError(true);
										}
									}}
								/>
							)}
						</div>
					</div>
					<GridRow heading={t("batch_no")} context={product.batchNumber} />
					<GridRow heading={t("label_code")} context={props.shipments.label.labelId} />
				</div>
			</div>
		</div>
	);
}

export default function ProductInfo(props) {
  const { t } = props;
  const [error, setError] = useState(false);
    const closeModalFail = () => {
      setError(false);
    };
  const [deliveredProductList, setDeliveredProductList] = useState([]);
  const updateList = (index, value) => {
    let temp = [...deliveredProductList];
    if (index === -1) temp.push(value);
		else temp[index] = value;
    setDeliveredProductList([...temp]);
    return temp;
	};
  return Object.keys(props.shipments).length === 0 ? (
		<div className="col-sm-4">
			<div className="row panel justify-content-between">N/A</div>
		</div>
	) : (
		<div className="col-sm-4">
			{props.shipments.products.map((product, index) => (
				<Product
					{...props}
					index={index}
					product={product}
					deliveredProductList={deliveredProductList}
					updateList={updateList}
					setError={setError}
				/>
			))}
			{error && (
				<Modal close={() => closeModalFail()} size="modal-sm">
					<FailPopup
						message="Quantity cannot be greater than sent"
						onHide={closeModalFail} //FailurePopUp
						t={t}
					/>
				</Modal>
			)}
		</div>
	);
}
