import React from "react";

function GridRow({ heading, context }) {
  return (
    <div className="ShipmentInfo--content-space-alt">
      <div className="ShipmentInfo--grid-column">
        <p className="info-text-width info-content-text text-secondary">
          {heading}
        </p>
        <p className="info-content-text">{context}</p>
      </div>
    </div>
  );
}

export default function ProductInfo(props) {
  const { t } = props;

  const getVisibleDate = (dateString) => {
    let date = new Date(dateString);
    if (date.toLocaleDateString() === "Invalid Date") return "N/A";
    console.log(`${date.getMonth() + 1}/${date.getFullYear()}`);
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return Object.keys(props.shipments).length === 0 ? (
    <div className="row panel justify-content-between">N/A</div>
  ) : (
    <>
      {props.shipments?.products?.map((product, index) => (
        <div className="ShipmentInfo--main-container">
          <div className="ShipmentInfo--info-wrapper">
            <GridRow
              heading={t("product_name")}
              context={product.productName}
            />
            <GridRow
              heading={t("manufacturer")}
              context={product.manufacturer}
            />
            <GridRow heading={t("batch_no")} context={product?.batchNumber} />
            <GridRow
              heading={t("quantity") + " " + t("sent")}
              context={`${product.productQuantity} ${
                product.unitofMeasure && product.unitofMeasure.name
                  ? `(${product.unitofMeasure.name})`
                  : ""
              }`}
            />
            <GridRow
              heading={t("quantity") + " " + t("received")}
              context={`${
                product["productQuantityDelivered"]
                  ? product["productQuantityDelivered"]
                  : ""
              } ${
                product.unitofMeasure && product.unitofMeasure.name
                  ? `(${product.unitofMeasure.name})`
                  : ""
              }`}
            />
            <GridRow
              heading={t("label_code")}
              context={props.shipments.label.labelId}
            />
            <GridRow
              heading={t("mfg_date")}
              context={getVisibleDate(product.mfgDate)}
            />
            <GridRow
              heading={t("exp_date")}
              context={getVisibleDate(product.expDate)}
            />
          </div>
        </div>
      ))}
    </>
  );
}
