import React from "react";
import { styled } from "@mui/material/styles";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { useHistory } from "react-router";
import { t } from "i18next";

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&:before": {
    display: "none",
  },
  width: "100%",
  borderRadius: "0.8rem",
  margin: "1rem 0 !important",
  background: `#fff`,
  boxShadow: `rgba(149, 157, 165, 0.2) 0px 8px 24px`,
}));

const AccordionSummary = styled((props) => <MuiAccordionSummary {...props} />)(
  ({ theme }) => ({
    flexDirection: "row-reverse",
    "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
      transform: "rotate(90deg)",
    },
    "& .MuiAccordionSummary-content": {
      marginLeft: theme.spacing(1),
    },
    width: "100%",
    padding: "0.5rem 0.5rem !important",
  })
);

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

export default function PoCard({ poDetails, t }) {
  const [expanded, setExpanded] = React.useState("");

  const history = useHistory();

  const redirectToPO = (id) => {
    history.push(`/vieworder/${id}`);
  };

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <div className="chain-card-container">
      {/* <div className="location-address-header">
				<p className="mi-body-md f-500 mi-reset location-text-heading-color">
					{`${shipmentData?.receiver?.warehouse?.warehouseAddress?.firstLine}, ${shipmentData?.receiver?.warehouse?.warehouseAddress?.city}, ${shipmentData?.receiver?.warehouse?.warehouseAddress?.state}, ${shipmentData?.receiver?.warehouse?.warehouseAddress?.region}`}
				</p>
			</div> */}
      <div className="location-details-card">
        <Accordion
          expanded={expanded === "panel1"}
          onChange={handleChange("panel1")}
        >
          <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
            <div className="accordion-header">
              <div className="accordion-info">
                <div className="content-info-card">
                  <div className="content-icon-space">
                    <i className="fa-solid fa-id-card"></i>
                  </div>
                  <p className="mi-body-sm f-500 mi-reset">
                    {t("order_id")}: {poDetails?.id}
                  </p>
                </div>
                <div className="content-info-card">
                  <div className="content-icon-space">
                    <i className="fa-solid fa-calendar-days"></i>
                  </div>
                  <p className="mi-body-xs f-500 mi-reset grey">
                    {poDetails?.creationDate
                      ? new Date(poDetails?.creationDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="accordion-status">
                <div className="status-button">
                  <button
                    className="status-lable status-2"
                    style={{ width: "100%" }}
                    disabled
                  >
                    {poDetails?.poStatus}
                  </button>
                </div>
                <div className="collapse-icon">
                  {expanded === "panel1" ? (
                    <i className="fa-solid fa-angle-up"></i>
                  ) : (
                    <i className="fa-solid fa-angle-down"></i>
                  )}
                </div>
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div className="accordian-body">
              <div className="product-details-list">
                {poDetails?.products?.map((product, index) => (
                  <div key={index} className="product-list-card">
                    <p className="mi-body-sm f-500 mi-reset grey">
                      {product?.name}
                    </p>
                    <p className="mi-body-sm f-500 mi-reset">{`${
                      product?.productQuantity
                    } (${
                      product?.unitofMeasure?.name
                        ? product?.unitofMeasure?.name
                        : "N/A"
                    })`}</p>
                  </div>
                ))}
              </div>
              <button
                className="mi-btn mi-btn-sm mi-btn-secondary"
                onClick={() => redirectToPO(poDetails?.id)}
              >
                {t("view_order")}
              </button>
            </div>
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  );
}
