import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Add from "../../assets/icons/createshipment.png";
import CalenderIcon from "../../assets/icons/date_icon.png";
import EditTable from "./table/editTable";
import "./style.scss";
import { createShipment, getViewShipment } from "../../actions/shipmentActions";
import { turnOn, turnOff } from "../../actions/spinnerActions";
import {
	getShippingOrderById,
	getWarehouseByOrgId,
	getAllOrganisations,
	getProductsByInventoryId,
} from "../../actions/shippingOrderAction";
import { getOrder, getOpenOrderIds } from "../../actions/poActions";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ShipmentPopUp from "./shipmentPopUp";
import ShipmentFailPopUp from "./shipmentFailPopUp";
import Modal from "../../shared/modal";
import { Formik } from "formik";
import Select from "react-select";
import { getOrganizationsTypewithauth } from "../../actions/userActions";
import { searchProduct } from "../../actions/poActions";
import { getProductList } from "../../actions/productActions";
import { config } from "../../config";
import axios from "axios";

const NewShipment = (props) => {
	const { t } = props;
	const [OrderIds, setOrderIds] = useState([]);
	const [senderOrganisation, setSenderOrganisation] = useState([]);
	const [allOrganisations, setAllOrganisations] = useState([]);
	const [senderWarehouses, setSenderWarehouses] = useState([]);
	const [receiverWarehouses, setReceiverWarehouses] = useState([]);
	const [disabled, setDisabled] = useState(false);
	const [FromLocationSelected, setFromLocationSelected] = useState(false);
	const [FromLocationCheck, setFromLocationCheck] = useState("");
	const [products, setProducts] = useState([]);
	const [addProducts, setAddProducts] = useState([]);
	const [FromOrgLabel, setFromOrgLabel] = useState("Select Organisation Location");
	const dispatch = useDispatch();
	const [fetchdisabled, setfetchdisabled] = useState(false);
	const [pofetchdisabled] = useState(false);
	const [toOrgLocLabel, settoOrgLocLabel] = useState("");
	const [receiverOrgLoc, setReceiverOrgLoc] = useState(t("select_delivery_location"));
	const [category, setCategory] = useState([]);
	const [OrderId, setOrderId] = useState("Select Order ID");
	const [senderOrgId, setSenderOrgId] = useState("null");
	const [orderIdSelected, setOrderIdSelected] = useState(false);
	const [validShipmentID, setValidShipmentID] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState("");
	const [receiverOrgId, setReceiverOrgId] = useState("Select Organisation Name");
	const user = useSelector((state) => state.user);
	const [OrderDetails, setOrderDetails] = useState({});
	const [message, setMessage] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [productQuantity] = useState("");
	const [openCreatedInventory, setOpenCreatedInventory] = useState(false);
	const [openShipmentFail, setOpenShipmentFail] = useState(false);
	const [shipmentError, setShipmentError] = useState("");
	const [modalProps, setModalProps] = useState({});
	const [orgTypes, setOrgTypes] = useState([]);
	const [productsList, setProductsList] = useState([]);
	const ref1 = useRef(null);
	const ref2 = useRef(null);

	const customStyles = {
		option: (provided, state) => ({
			...provided,
			borderBottom: "1px solid #d6d6d6",
		}),
		control: () => ({
			display: "flex",
		}),
		indicatorSeparator: () => ({
			display: "none",
		}),
		singleValue: (provided, state) => {
			const opacity = state.isDisabled ? 0.5 : 1;
			const transition = "opacity 300ms";
			return { ...provided, opacity, transition };
		},
	};

	const handleSOChange = async (item) => {
		setOrderId(item);
		dispatch(turnOn());
		const result = await getShippingOrderById(item);
		setOrderDetails(result);
		dispatch(turnOff());
	};

	const closeModal = () => {
		setOpenCreatedInventory(false);
		props.history.push("/shipments");
	};

	const closeModalFail = () => {
		setOpenShipmentFail(false);
	};

	useEffect(() => {
		async function fetchData() {
			const result111 = await getProductList();
			setProductsList(result111.message);
			const categoryArray = result111.message.map((product) => product.productCategory);
			const result = await getOpenOrderIds();

			const ids = result.map((item) => {
				return {
					value: item.id,
					label: item.id,
				};
			});
			setOrderIds(ids);

			const orgs = await getAllOrganisations();
			const orgSplit = user.organisation?.split("/");
			if (orgSplit?.length) setSenderOrganisation([orgSplit[0]]);

			const organisations = orgs.data;
			setAllOrganisations(
				organisations.map((item) => {
					return {
						...item,
						value: item.id,
						label: item.name,
					};
				}),
			);
			setCategory(
				categoryArray
					.filter((value, index, self) => self.indexOf(value) === index)
					.map((item) => {
						return {
							value: item,
							label: item,
						};
					}),
			);

			const warehouses = await getWarehouseByOrgId(orgSplit?.length ? orgSplit[1] : "");
			if (warehouses) {
				setSenderWarehouses(
					warehouses.data.map((v) => {
						return {
							...v,
							value: v.id,
							label: v?.warehouseAddress
								? v?.title + "/" + v?.warehouseAddress?.firstLine + ", " + v?.warehouseAddress?.city
								: v?.title + "/" + v.postalAddress,
						};
					}),
				);
			}

			const orgType = await getOrganizationsTypewithauth("CONF000");
			setOrgTypes(
				orgType.data.length > 0
					? orgType.data[0].organisationTypes.map((item) => {
						return {
							value: item.id,
							label: item.name,
						};
					})
					: [],
			);

			// if (search) {
			//   const shippingId = search.split("=")[1];
			//   handleSOChange(shippingId);
			// }
		}

		fetchData();
	}, [props.location, user.organisation]);

	const onOrgChange = async (value) => {
		try {
			const warehouse = await getWarehouseByOrgId(value);
			setReceiverWarehouses(
				warehouse.data.map((v) => {
					return {
						...v,
						value: v.id,
						label: v?.warehouseAddress
							? v?.title + "/" + v?.warehouseAddress?.firstLine + ", " + v?.warehouseAddress?.city
							: v?.title + "/" + v.postalAddress,
					};
				}),
			);
		} catch (err) {
			setErrorMessage(err);
		}
	};

	const onWarehouseChange = async (value) => {
		try {
			const prods = await getProductsByInventoryId(value);
			if (prods.data.length === 0) {
				alert("No products availabe in this warehouse");
				setErrorMessage("err");
				return false;
			}
			setProducts(
				prods.data.map((item) => {
					return {
						value: item.name,
						label: item.name,
						...item,
					};
				}),
			);
			setProductsList(
				prods.data.map((item) => {
					return {
						value: item.name,
						label: item.name,
						...item,
					};
				}),
			);
			return true;
		} catch (err) {
			setErrorMessage(err);
			return false;
		}
	};

	const onAssign = async (values) => {
		let error = false;
		const {
			toOrg,
			airWayBillNo,
			reset,
			shipmentDate,
			estimateDeliveryDate,
			toOrgLoc,
			fromOrgLoc,
			shipmentID,
			products,
		} = values;
		let errorMsg = "";
		products.forEach((p) => {
			if (p.productQuantity < 1) {
				error = true;
				errorMsg = `${t("product")}${t("quantity")}`;
			} else if (!p.batchNumber) {
				error = true;
				errorMsg = t("batch_number");
			}
		});
		if (!error) {
			const data = {
				airWayBillNo,
				poId: reset && reset !== "Select Order ID" ? reset : null,
				label: {
					// labelId: labelCode ? labelCode : Date.now(),
					labelId: Date.now(),
					labelType: "QR_2DBAR",
				},
				taggedShipments: shipmentID,
				externalShipmentId: "",
				supplier: {
					id: user.organisationId,
					locationId: fromOrgLoc,
				},
				receiver: {
					id: toOrg.split("/")[0],
					locationId: toOrgLoc.split("/")[0],
				},
				shippingDate: shipmentDate,
				expectedDeliveryDate: estimateDeliveryDate,
				actualDeliveryDate: null,
				status: "CREATED",
				products: products,
				// poId: OrderDetails.purchaseOrderId ? OrderDetails.purchaseOrderId : null,
			};

			var check = 0;

			for (const element of data.products) {
				if (typeof element.productQuantity === "undefined") {
					check = 1;
					break;
				}
				if (typeof element.batchNumber === "undefined") {
					check = 2;
					break;
				}
			}
			if (check === 1) {
				setShipmentError(t("check_product_quantity"));
				setOpenShipmentFail(true);
			} else if (check === 2) {
				setShipmentError(t("check_batch_numbers"));
				setOpenShipmentFail(true);
			} else {
				let i, j;
				let nn = data.products.length;
				for (i = 0; i < data.products.length; i++) {
					let prdctName = data.products[i].productName;
					let flag = false;

					for (j = 0; j < productsList.length; j++) {
						if (productsList[j].productName === prdctName) {
							flag = true;
							break;
						} else {
							flag = false;
						}
					}

					if (!flag) {
						setShipmentError(t("product_not_exist_inventory"));
						setOpenShipmentFail(true);
						break;
					}
				}
				if (i >= nn) {
					dispatch(turnOn());
					const result = await createShipment(data);
					dispatch(turnOff());
					if (result?.id) {
						setMessage("Created Shipment Success");
						setOpenCreatedInventory(true);
						setModalProps({
							message: "Created Successfully!",
							id: result?.id,
							type: "Success",
							points:200,
							t: t,
						});
					} else {
						setShipmentError(result?.data?.message);
						setOpenShipmentFail(true);
						setErrorMessage("Create Shipment Failed");
					}
				}
			}
		} else {
			setShipmentError(t("check") + " " + errorMsg);
			setOpenShipmentFail(true);
		}
	};

	const handleQuantityChange = (value, i) => {
		const soDetailsClone = { ...OrderDetails };
		if (parseInt(value) > parseInt(soDetailsClone.products[i].orderedQuantity)) {
			soDetailsClone.products[i].productQuantity = soDetailsClone.products[i].orderedQuantity;
			setOrderDetails(soDetailsClone);
			alert(t("quantity_not_more_error"));
			return;
		}
		soDetailsClone.products[i].productQuantity = value;
		setOrderDetails(soDetailsClone);
	};

	const handleBatchChange = (value, i) => {
		console.log("Batch:", value, i);
		const soDetailsClone = { ...OrderDetails };
		soDetailsClone.products[i].batchNumber = value;
		setOrderDetails(soDetailsClone);
	};

	const handleLabelIdChange = (value, i) => {
		const soDetailsClone = { ...OrderDetails };
		soDetailsClone.products[i]["labelId"] = value;
		setOrderDetails(soDetailsClone);
	};

	const onCategoryChange = async (index, value, setFieldValue) => {
		try {
			const warehouse = await searchProduct(value, selectedWarehouse);
			let newArr = [...addProducts];
			newArr[index]["type"] = value;
			newArr[index] = {
				productId: "",
				batchNumber: "",
				id: "",
				productQuantity: "",
				name: "",
				type: value,
				manufacturer: "",
				unitofMeasure: "",
				atomId: "",
			};
			newArr[index]["quantity"] = "";
			setAddProducts((prod) => [...newArr]);
			let buffer = warehouse.filter((item) => item.inventoryDetails.quantity > 0);
			setProducts(
				buffer.map((item) => {
					return {
						value: item.products.name,
						label: item.products.name,
						...item.products,
					};
				}),
			);
		} catch (err) {
			setErrorMessage(err);
		}
	};

	function onSearchChange(e) {
		axios.get(`${config().getSuggestions}?searchString=${e}`).then((resp) => {
			const value = resp.data.data.length > 0 ? true : false;
			setValidShipmentID(value);
		});
	}

	return (
		<div className="NewShipment">
			<h1 className="breadcrumb">{t("create_shipment")}</h1>
			<Formik
				enableReinitialize={true}
				initialValues={{
					poId: "",
					type: "",
					typeName: "",
					shipmentID: "",
					rtype: "",
					rtypeName: "",
					fromOrg: senderOrganisation[0],
					fromOrgLoc: "",
					toOrg: "",
					toOrgLoc: "",
					airWayBillNo: "",
					labelCode: "",
					shipmentDate: "",
					estimateDeliveryDate: "",
					products: [],
					reset: OrderId,
				}}
				validate={(values) => {
					const errors = {};
					if (!values.fromOrg) {
						errors.fromOrg = "Required";
					}
					if (!values.fromOrgLoc) {
						errors.fromOrgLoc = "Required";
					}
					if (!values.toOrg) {
						errors.toOrg = "Required";
					}
					if (!values.toOrgLoc) {
						errors.toOrgLoc = "Required";
					}
					// Commented out To disable required validation
					// if (!values.airWayBillNo) {
					//   errors.airWayBillNo = "Required";
					// }
					// if (!values.labelCode) {
					//   errors.labelCode = "Required";
					// }
					if (!values.shipmentDate) {
						errors.shipmentDate = "Required";
					}
					// if (!values.estimateDeliveryDate) {
					//   errors.estimateDeliveryDate = "Required";
					// }
					if (!orderIdSelected && values.products.length === 0) {
						errors.products = "Required";
					}
					return errors;
				}}
				onSubmit={(values, { setSubmitting }) => {
					setSubmitting(false);
					onAssign(values);
				}}
			>
				{({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
					<form onSubmit={handleSubmit} className="mb-3">
						<div className="row mb-3">
							<div className="col bg-white formContainer low mr-3">
								<div className="row mt-3">
									<div className="col-md-6 col-sm-12">
										<div className="form-group">
											<label className="name" htmlFor="orderID">
												{t("order_id")}
											</label>
											<div className="line">
												<Select
													noOptionsMessage={() => t("no_options")}
													styles={customStyles}
													placeholder={t("enter") + " " + t("order_id")}
													onChange={async (v) => {
														setfetchdisabled(true);
														setProducts((p) => []);
														setAddProducts((p) => []);
														setOrderIdSelected(true);
														setFieldValue("OrderId", v.value);
														setOrderId(v.value);
														dispatch(turnOn());
														let result = await dispatch(getOrder(v.value));
														setSenderOrgId(result.poDetails[0].customer.warehouse.id);
														for (const element of result.poDetails[0].products) {
															if (
																element.productQuantityShipped ||
																element.productQuantityDelivered
															) {
																element.productQuantity =
																	parseInt(element.productQuantity) -
																	parseInt(
																		element.productQuantityShipped || 0,
																	) -
																	parseInt(
																		element.productQuantityDelivered || 0,
																	);
															}
															element.orderedQuantity =
																element.productQuantity;
														}
														setReceiverOrgLoc(
															result.poDetails[0].customer.warehouse.title +
															"/" +
															result.poDetails[0].customer.warehouse.postalAddress,
														);
														setReceiverOrgId(result.poDetails[0].customer.organisation.name);
														setOrderDetails(result.poDetails[0]);
														dispatch(turnOff());
														setDisabled(true);
														let warehouse = senderWarehouses.filter((w) => {
															let supplierWarehouse =
																result.poDetails[0].supplier.organisation.warehouses;
															for (const element of supplierWarehouse) {
																return w.id === element;
															}
														});
														setFieldValue("fromOrg", senderOrganisation[0]);
														setFieldValue("fromOrgLoc", "");
														setFieldValue(
															"toOrg",
															result.poDetails[0].customer.organisation.id +
															"/" +
															result.poDetails[0].customer.organisation.name,
														);
														// settoOrgLocLabel(result.poDetails[0].customer.organisation.id + "/"+result.poDetails[0].customer.organisation.name)
														let wa = result.poDetails[0].customer.warehouse;
														setFieldValue(
															"toOrgLoc",
															result.poDetails[0].customer.shippingAddress.shippingAddressId +
															"/" +
															(wa?.warehouseAddress
																? wa?.title +
																"/" +
																wa?.warehouseAddress?.firstLine +
																", " +
																wa?.warehouseAddress?.city
																: wa?.title + "/" + wa.postalAddress),
														);
														settoOrgLocLabel(
															wa?.warehouseAddress
																? wa?.title +
																"/" +
																wa?.warehouseAddress?.firstLine +
																", " +
																wa?.warehouseAddress?.city
																: wa?.title + "/" + wa.postalAddress,
														);
														setFieldValue("rtype", result.poDetails[0].customer.organisation.type);

														let products_temp = result.poDetails[0].products.filter(
															(item) => item.productQuantity > 0,
														);
														if (
															result.poDetails[0].products &&
															result.poDetails[0].products.length
														) {
															for (let i = 0; i < products_temp.length; i++) {
																if (result.poDetails[0].products[i].productQuantity === 0) {
																	result.poDetails[0].products.splice(i, 1);
																	i--;
																	continue;
																}
																products_temp[i].manufacturer =
																	result.poDetails[0]?.products[i]?.manufacturer;
																products_temp[i].productName = result.poDetails[0].products[i].name;
																products_temp[i].productQuantity =
																	result.poDetails[0].products[i].productQuantity;
																products_temp[i].productCategory =
																	result.poDetails[0].products[i].type;
																products_temp[i].productID =
																	result.poDetails[0].products[i].productId;
																products_temp[i].batchNumber = "";
																products_temp[i].atomId = "";
																products_temp[i].productQuantityDelivered =
																	result.poDetails[0].products[i].productQuantityDelivered;
																products_temp[i].productQuantityShipped =
																	result.poDetails[0].products[i].productQuantityShipped;
															}
														}
														if (result.poDetails[0].products.length > 0) {
															setProducts((p) => []);
															setAddProducts([...products_temp]);
															setFieldValue("products", products_temp);
														} else setFieldValue("products", []);
													}}
													defaultInputValue={values.OrderId}
													options={pofetchdisabled ? "" : OrderIds}
												/>
											</div>
										</div>
									</div>
									<div className="col-md-6 com-sm-12">
										<label
											className="name"
											htmlFor="shipmentID"
											style={{ position: "relative", top: "0.5rem" }}
										>
											{t("reference_shipment_id")}
										</label>
										<input
											className="refship" //input
											type="text"
											id="referenceShipmentId"
											name="shipmentID"
											value={values.shipmentID}
											onBlur={handleBlur}
											placeholder={t("enter") + " " + t("reference_shipment_id")}
											onChange={(event, newValue) => {
												handleChange(event);
												onSearchChange(event.target.value);
											}}
										/>
									</div>
								</div>
								<div className="fetch">
									{values.shipmentID.length > 0 ? (
										<span
											style={{ height: "25px", width: "50px" }}
											className="btn btn-fetch"
											onClick={async () => {
												// setpofetchdisabled(true);
												setAddProducts((p) => []);
												setFromLocationCheck("NO_VALUE")
												setOrderIdSelected(true);
												setProducts((p) => []);
												dispatch(turnOn());
												setDisabled(false);
												if (values.shipmentID.length === 0) {
													setShipmentError(t("shipment_cannot_be_empty"));
													setOpenShipmentFail(true);
													dispatch(turnOff());
												} else {
													if (validShipmentID) {
														let result = await getViewShipment(values.shipmentID);
														if (!result.success) {
															setShipmentError(t("check_shipment_reference_id"));
															setOpenShipmentFail(true);
															dispatch(turnOff());
														} else {
															// Check whether the shipment is an outbound shipment
															if (user.warehouseId.includes(result.data.supplier.locationId)) {
																setShipmentError(t("The shipment is an outbound shipment!"));
																setOpenShipmentFail(true);
																dispatch(turnOff());
															} else {
																setSenderOrgId(result.data.supplier.locationId);
																// This is required.
																result = result.data;
																if (result.status !== "RECEIVED") {
																	values.shipmentID = "";
																	// alert("The shipment has to be delivered first");
																	setShipmentError(t("shipment_has_to_be_delivered"));
																	setOpenShipmentFail(true);
																	dispatch(turnOff());
																} else {
																	for (let i = 0; i < result.products?.length; i++) {
																		result.products[i].orderedQuantity =
																			result.products[i].productQuantity;
																	}
																	setFieldValue("fromOrg", "");
																	setFieldValue("fromOrgLoc", "");
																	setFieldValue("rtype");
																	setFieldValue("toOrg", "");
																	dispatch(turnOff());
																	setFieldValue("toOrgLoc", "");
																	setReceiverOrgLoc();
																	setReceiverOrgId();
																	setOrderDetails(result);
																	settoOrgLocLabel("");
																	// settoOrgLocLabel(wa?.warehouseAddress ? wa?.title + '/' + wa?.warehouseAddress?.firstLine + ", " + wa?.warehouseAddress?.city : wa?.title + '/' + wa.postalAddress)
																	let products_temp = result.products;
																	for (let i = 0; i < products_temp.length; i++) {
																		products_temp[i].manufacturer = result.products[i].manufacturer;
																		products_temp[i].name = result.products[i].productName;
																		if (result?.poDetails && result?.poDetails?.length) {
																			const poProduct = result?.poDetails[0]?.products?.find(
																				(elem) => elem.productId === result?.products[i]?.productID,
																			);
																			products_temp[i].productQuantity =
																				parseInt(poProduct.productQuantityDelivered || 0) -
																				parseInt(
																					result?.products[i].productQuantityTaggedSent || 0,
																				);
																		} else {
																			products_temp[i].productQuantity =
																				parseInt(
																					result?.products[i].productQuantityDelivered || 0,
																				) -
																				parseInt(
																					result?.products[i].productQuantityTaggedSent || 0,
																				);
																		}
																		products_temp[i].productCategory =
																			result.products[i].productCategory;
																		delete products_temp[i].productQuantityDelivered;
																		products_temp[i].batchNumber = "";
																		products_temp[i].atomId = "";
																		products_temp[i].id = result.products[i].productID;
																	}
																	if (result.products.length > 0) {
																		setProducts((p) => []);
																		setAddProducts((p) => products_temp);
																		setFieldValue("products", products_temp);
																	} else setFieldValue("products", []);
																}
															}
														}
													} else {
														setShipmentError(t("invalid_shipmentid_enter"));
														setOpenShipmentFail(true);
														dispatch(turnOff());
													}
												}
											}}
										>
											<span
												style={{
													position: "relative",
													top: "-6px",
													fontSize: "12px",
													left: "-11px",
												}}
											>
												{t("fetch") === "Fetch" ? "Fetch" : "obtener"}
											</span>
										</span>
									) : (
										<span style={{ height: "25px", width: "60px" }} className="btn fetchDisable">
											<span
												style={{
													position: "relative",
													top: "-6px",
													fontSize: "12px",
													left: "-11px",
												}}
											>
												{t("fetch") === "Fetch" ? "Fetch" : "Obtener"}
											</span>
										</span>
									)}
								</div>
							</div>
						</div>

						<div className="row mb-3">
							<div className="col bg-white formContainer low mr-3">
								<label htmlFor="client" className="headsup">
									{t("from")}
								</label>
								{/* <div className="row">
                  <div className="col-md-6 com-sm-12">
                    <div className="form-group">
                      <label htmlFor="organizationType">Organisation Type*</label>
                      <div className="form-control">
                        <Select
                          styles={customStyles}
                          isDisabled={disabled}
                          placeholder="Select Organisation Type"
                          onChange={(v) => {
                            setFieldValue('type', v?.value);
                            setFieldValue('typeName', v?.label);
                          }}
                          defaultInputValue={values.typeName}
                          options={orgTypes}
                        />
                        {errors.type && touched.type && (
                          <span className="error-msg text-danger">{errors.type}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div> */}
								<div className="row">
									<div className="col-md-6 com-sm-12">
										<div className="form-group">
											<label className="name" htmlFor="organizationName">
												{t("organisation_name")}*
											</label>
											<div className="line">
												{/* <DropdownButton
                          name={senderOrganisation[0]}
                          disabled={true}
                          onSelect={() => {}}
                          groups={senderOrganisation}
                        /> */}
												<Select
													noOptionsMessage={() => t("no_options")}
													styles={customStyles}
													isDisabled={true}
													onChange={(v) => { }}
													placeholder={senderOrganisation[0]}
													defaultInputValue={senderOrganisation[0]}
													value={senderOrganisation[0]}
													options={senderOrganisation.map((v) => {
														return {
															value: v,
															label: v,
														};
													})}
												/>
											</div>
										</div>
									</div>

									<div className="col-md-6 com-sm-12">
										<div className="form-group">
											<label className="name" htmlFor="orgLocation">
												{t("organisation_location")}*
											</label>
											<div
												className={`line ${errors.fromOrgLoc && touched.fromOrgLoc ? "border-danger" : ""
													}`}
											>
												{/* <DropdownButton
                          name={senderOrgLoc}
                          name2="Select Organisation Location"
                          disabled={false}
                          onSelect={(v) => {
                            onWarehouseChange(v.warehouseInventory);
                            setFieldValue("fromOrg", senderOrganisation[0]);
                            setSenderOrgLoc(
                              v?.warehouseAddress
                                ? v?.title + '/' + v?.warehouseAddress?.firstLine +
                                    ", " +
                                    v?.warehouseAddress?.city
                                : v?.title + '/' + v.postalAddress
                            );
                            setFieldValue("fromOrgLoc", v.id);
                      //      setFieldValue("products", []);
                            setAddProducts((prod) => []);
                            let newArr = {
                              productName: "",
                              manufacturer: "",
                              productQuantity: "",
                            };
                            setAddProducts((prod) => [...prod, newArr]);
                          }}
                          groups={senderWarehouses}
                        /> */}
												<Select
													noOptionsMessage={() => t("no_options")}
													styles={customStyles}
													isDisabled={false}
													placeholder={t("select") + " " + t("organisation_location")}
													onChange={async (v) => {
														let res = await onWarehouseChange(v.warehouseInventory);
														if (!res) {
															return;
														}
														setFromOrgLabel(v.label);
														setFromLocationCheck("VALUE");
														setSelectedWarehouse(v.id);
														setFromLocationSelected(true);
														setFieldValue("fromOrg", senderOrganisation[0]);
														setFieldValue("fromOrgLoc", v.value);
														setSenderOrgId(v.value);
														if (!OrderDetails?.products?.length) {
															setAddProducts((prod) => []);
															let newArr = {
																productName: "",
																manufacturer: "",
																productQuantity: "",
																batchNumber: "",
																unitofMeasure: "",
																atomId: "",
															};
															setAddProducts((prod) => [...prod, newArr]);
														}
													}}
													value={
														values.fromOrgLoc === ""
															? t("select") + " " + t("organisation_location")
															: {
																value: values.fromOrgLoc,
																label: FromOrgLabel,
															}
													}
													options={senderWarehouses.filter(
														(ele, ind) =>
															ind ===
															senderWarehouses.findIndex((elem) => elem.label === ele.label),
													)}
												/>
												{/* {errors.fromOrgLoc && touched.fromOrgLoc && (
                          <span className="error-msg text-danger">
                            {errors.fromOrgLoc}
                          </span>
                        )} */}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="row mb-3">
							<div className="col bg-white formContainer low mr-3">
								<label htmlFor="client" className="headsup">
									{t("to")}
								</label>
								<div className="row">
									<div className="col-md-6 com-sm-12">
										<div className="form-group">
											<label className="name" htmlFor="organizationType">
												{t("organisation_type")}*
											</label>
											<div
												className={`line ${errors.rtype && touched.rtype ? "border-danger" : ""}`}
											>
												<Select
													noOptionsMessage={() => t("no_options")}
													styles={customStyles}
													isDisabled={disabled}
													placeholder={
														disabled ? values.rtype : t("select") + " " + t("organisation_type")
													}
													onChange={(v) => {
														setFieldValue("rtype", v?.value);
														setFieldValue("rtypeName", v?.label);
														setFieldValue("toOrg", "");
														setFieldValue("toOrgLoc", "");
													}}
													options={orgTypes}
												/>
												{/* {errors.rtype && touched.rtype && (
                          <span className="error-msg text-danger">{errors.rtype}</span>
                        )} */}
											</div>
										</div>
									</div>
								</div>
								<div className="row">
									<div className="col-md-6 com-sm-12">
										<div className="form-group">
											<label className="name" htmlFor="organizationName">
												{t("organisation_name")}*
											</label>
											<div
												className={`line ${errors.toOrg && touched.toOrg ? "border-danger" : ""}`}
											>
												{/* <DropdownButton
                          name={receiverOrgId}
                          name2="Select Organisation Name"
                          disabled={disabled}
                          onSelect={(v) => {
                            setReceiverOrgLoc("Select Delivery Location");
                            setFieldValue("toOrgLoc", "");
                            setReceiverOrgId(v.name);
                            setFieldValue("toOrg", v.id);
                            onOrgChange(v.id);
                          }}
                          groups={allOrganisations}
                        /> */}
												<Select
													noOptionsMessage={() => t("no_options")}
													styles={customStyles}
													isDisabled={disabled}
													placeholder={
														disabled
															? values.toOrg.split("/")[1]
															: t("select") + " " + t("organisation_name")
													}
													value={
														values.toOrg === ""
															? t("select") + " " + t("organisation_name")
															: { value: values.toOrg, label: receiverOrgId }
													}
													onChange={(v) => {
														setFieldValue("toOrgLoc", "");
														setReceiverOrgId(v.label);
														setFieldValue("toOrg", v.value);
														onOrgChange(v.value);
													}}
													options={allOrganisations.filter((org) => {
														if (
															(user.type === "DISTRIBUTORS" || user.type === "DROGUERIA") &&
															(values.rtypeName === "PHARMACY" || values.rtypeName === "Farmacia")
														) {
															return (
																org.type === values.rtypeName &&
																org.parentOrgId === user.organisationId
															);
														}
														return org.type === values.rtypeName;
													})}
												/>
											</div>
										</div>
									</div>

									<div className="col-md-6 com-sm-12">
										<div className="form-group">
											<label className="name" htmlFor="delLocation">
												{t("delivery_location")}*
											</label>
											<div
												className={`line ${errors.toOrgLoc && touched.toOrgLoc ? "border-danger" : ""
													}`}
											>
												{/* <DropdownButton
                          name={receiverOrgLoc}
                          name2="Select Delivery Location"
                          disabled={disabled}
                          onSelect={(v) => {
                            setReceiverOrgLoc(
                              v?.warehouseAddress
                                ? v?.title + '/' + v?.warehouseAddress?.firstLine +
                                    ", " +
                                    v?.warehouseAddress?.city
                                : v?.title + '/' + v.postalAddress
                            );
                            setFieldValue("toOrgLoc", v.id);
                          }}
                          groups={receiverWarehouses}
                        /> */}
												<Select
													styles={customStyles}
													//isDisabled={disabled}
													placeholder={
														disabled ? values.toOrgLoc.split("/")[1] : t("select_delivery_location")
													}
													//placeholder={"Select Delivery Location"}
													value={
														values.toOrgLoc === ""
															? t("select_delivery_location")
															: { value: values.toOrgLoc, label: toOrgLocLabel }
													}
													onChange={(v) => {
														setFieldValue("toOrgLoc", v.value);
														settoOrgLocLabel(v.label);
													}}
													defaultInputValue={values.toOrgLoc}
													options={receiverWarehouses.filter(
														(ele, ind) =>
															ind ===
															receiverWarehouses.findIndex((elem) => elem.label === ele.label),
													)}
													noOptionsMessage={() => t("no_options")}
												/>
												{/* {errors.toOrgLoc && touched.toOrgLoc && (
                          <span className="error-msg text-danger">
                            {errors.toOrgLoc}
                          </span>
                        )} */}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="row mb-3">
							<div className="col bg-white formContainer low mr-3">
								<label htmlFor="client" className="headsup">
									{t("delivery_details")}:
								</label>
								<div className="row">
									<div className="col-md-6 com-sm-12 mt-2">
										<label className="name" htmlFor="organizationName">
											{t("transit_no")}
										</label>
										<input
											className={`input refship ${errors.airWayBillNo && touched.airWayBillNo ? "" : ""
												}`}
											type="text"
											id="referenceShipmentId"
											name="airWayBillNo"
											value={values.airWayBillNo}
											onBlur={handleBlur}
											placeholder={t("enter") + " " + t("transit_no")}
											onChange={handleChange}
										/>
										{/* {errors.airWayBillNo && touched.airWayBillNo && (
                        <span className="error-msg text-danger-AB">
                          {errors.airWayBillNo}
                        </span>
                      )} */}
									</div>

									<div className="col-md-6 com-sm-12 mt-3">
										<div className="form-group">
											<label className="name" htmlFor="delLocation">
												{t("shipment_date")}*
											</label>
											<div
												className={`input refship ${errors.shipmentDate && touched.shipmentDate ? "border-danger" : ""
													}`}
											>
												<DatePicker
													dateFormat="dd/MM/yyyy"
													ref={ref1}
													className="date"
													selected={
														values.shipmentDate
															? new Date(Date.parse(values.shipmentDate))
															: values.shipmentDate
													}
													onKeyDown={(e) => e.keyCode !== 8 && e.preventDefault()}
													minDate={new Date()}
													placeholderText={t("enter") + " " + t("shipment_date")}
													onChange={(date) => {
														setFieldValue("shipmentDate", date);
														setFieldValue("estimateDeliveryDate", "");
													}}
													showYearDropdown
													dateFormatCalendar="MMMM"
													yearDropdownItemNumber={15}
													scrollableYearDropdown
												/>
												<img
													src={CalenderIcon}
													alt="calenderIcon"
													className="Calender-icon"
													onClick={() => ref1.current.setFocus()}
												/>
												{/* {errors.shipmentDate && touched.shipmentDate && (
                          <span className="error-msg text-danger-SD">
                            {errors.shipmentDate}
                          </span>
                        )} */}
											</div>
										</div>
									</div>
								</div>
								<div className="row">
									<div className="col-md-6 com-sm-12">
										<label className="name" htmlFor="organizationName">
											{t("label_code")}
										</label>
										<input
											className={`input refship`}
											type="text"
											id="referenceShipmentId"
											name="labelCode"
											value={values.labelCode}
											onBlur={handleBlur}
											placeholder={t("enter") + " " + t("label_code")}
											onChange={handleChange}
										/>
										{errors.labelCode && touched.labelCode && (
											<span className="error-msg text-danger-LC">{errors.labelCode}</span>
										)}
									</div>

									<div className="col-md-6 com-sm-12">
										<div className="form-group">
											<label className="name" htmlFor="shipmentId ">
												{t("estimated_delivery_date")}
											</label>
											<div
												className={`input refship ${errors.estimateDeliveryDate && touched.estimateDeliveryDate
													? "border-danger"
													: ""
													}`}
											>
												<DatePicker
													dateFormat="dd/MM/yyyy"
													ref={ref2}
													className="date"
													placeholderText={t("enter_delivery_date")}
													onChange={(date) => {

														setFieldValue("estimateDeliveryDate", date);
														// setEstimateDeliveryDate(date);
													}}
													selected={
														values.estimateDeliveryDate
															? new Date(Date.parse(values.estimateDeliveryDate))
															: values.estimateDeliveryDate
													}
													minDate={values.shipmentDate ? new Date(values.shipmentDate) : new Date()}
													onKeyDown={(e) => e.keyCode !== 8 && e.preventDefault()}
													showYearDropdown
													dateFormatCalendar="MMMM"
													yearDropdownItemNumber={100}
													scrollableYearDropdown
												/>
												<img
													src={CalenderIcon}
													alt="calenderIcon"
													className="Calender-icon"
													onClick={() => ref2.current.setFocus()}
												/>
												{errors.estimateDeliveryDate && touched.estimateDeliveryDate && (
													<span className="error-msg text-danger-DD">
														{errors.estimateDeliveryDate}
													</span>
												)}
												<div />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="row mb-3">
							<label htmlFor="productDetails" className="headsup">
								{t("product_details")}
							</label>
							{OrderDetails?.products?.length > 0 ? (
								<EditTable
									t={t}
									check="1"
									FromLocationSelected={FromLocationSelected}
									setFromLocationCheck={setFromLocationCheck}
									warehouseID={senderOrgId}
									product={OrderDetails?.products}
									handleQuantityChange={(v, i) => {
										handleQuantityChange(v, i);
										const soDetailsClone = { ...OrderDetails };
										let qty;
										if (parseInt(v) > parseInt(soDetailsClone.products[i].orderedQuantity)) {
											qty = soDetailsClone.products[i].orderedQuantity;
										} else {
											qty = v;
										}
										let newArr = [...addProducts];
										newArr[i].productQuantity = qty;
										if (newArr.length > 0)
											setFieldValue(
												"products",
												newArr.map((row) => ({
													productCategory: row.type,
													productID: row.id,
													productQuantity: row.productQuantity,
													batchNumber: row.batchNumber,
													productName: row.name,
													manufacturer: row.manufacturer,
													quantity: row.quantity,
													unitofMeasure: row.unitofMeasure,
													atomId: row.atomId,
												})),
											);
										else setFieldValue("products", []);
										setAddProducts((prod) => [...newArr]);
									}}
									handleBatchChange={(v, i, batch) => {
										handleBatchChange(v, i);
										let newArr = [...addProducts];
										newArr[i].batchNumber = v;
										newArr[i].atomId = batch[0].atomId;
										if (newArr.length > 0)
											setFieldValue(
												"products",
												newArr.map((row) => ({
													productCategory: row.type,
													productID: row.id,
													productQuantity: row.productQuantity,
													batchNumber: row.batchNumber,
													productName: row.name,
													manufacturer: row.manufacturer,
													quantity: row.quantity,
													unitofMeasure: row.unitofMeasure,
													atomId: row.atomId,
												})),
											);
										else setFieldValue("products", []);
										setAddProducts((prod) => [...newArr]);
									}}
									enableDelete={false}
									onRemoveRow={(index) => {
										const prodIndex = products.findIndex(
											(p) => p.id === OrderDetails?.products[index].id,
										);
										let newArray = [...products];
										newArray[prodIndex] = {
											...newArray[prodIndex],
											isSelected: false,
										};
										setProducts((prod) => [...newArray]);

										OrderDetails?.products.splice(index, 1);
										let newArr = [...OrderDetails?.products];
										if (newArr.length > 0)
											setFieldValue(
												"products",
												newArr.map((row) => ({
													productCategory: row.type,
													productID: row.id,
													productQuantity: row.productQuantity,
													batchNumber: row.batchNumber,
													productName: row.name,
													manufacturer: row.manufacturer,
													quantity: row.quantity,
													unitofMeasure: row.unitofMeasure,
													atomId: row.atomId,
												})),
											);
										else setFieldValue("products", []);
										setAddProducts((prod) => [...newArr]);
									}}
									handleLabelIdChange={handleLabelIdChange}
								/>
							) : (
								products?.length <= 0 && (
									<div>
										<h4
											style={{
												fontSize: "100%",
												marginRight: "550px",
												marginLeft: "-105px",
												color: "red",
											}}
											className="mt-5 "
										>
											*{t("no_products_available")}
										</h4>
									</div>
								)
							)}

							{!orderIdSelected && products?.length > 0 && (
								<>
									<EditTable
										check="0"
										FromLocationSelected={FromLocationSelected}
										setFromLocationCheck={setFromLocationCheck}
										warehouseID={senderOrgId}
										product={addProducts}
										t={t}
										products={products}
										category={category}
										handleQuantityChange={(v, i) => {
											let newArr = [...addProducts];
											newArr[i].productQuantity = v;
											setFieldValue(
												"products",
												newArr.map((row) => ({
													productCategory: row.type,
													productID: row.id,
													productQuantity: row.productQuantity,
													batchNumber: row.batchNumber,
													productName: row.name,
													manufacturer: row.manufacturer,
													quantity: row.quantity,
													unitofMeasure: row.unitofMeasure,
													atomId: row.atomId,
												})),
											);
											setAddProducts((prod) => [...newArr]);
										}}
										handleBatchChange={(v, i, batch) => {
											let newArr = [...addProducts];
											if (batch?.length > 1 && batch[0].index === i) {
												batch.forEach((elem) => {
													newArr[elem.index] = { ...addProducts[0] };
													newArr[elem.index].batchNumber = elem.bnp;
													newArr[elem.index].productQuantity = elem.quant;
													newArr[elem.index].atomId = elem.atomId;
												});
												setFieldValue(
													"products",
													newArr.map((row) => ({
														productCategory: row.type,
														productID: row.id,
														productQuantity: row.productQuantity,
														batchNumber: row.batchNumber,
														productName: row.name,
														manufacturer: row.manufacturer,
														quantity: row.quantity,
														unitofMeasure: row.unitofMeasure,
														atomId: row.atomId,
													})),
												);
												setAddProducts(() => [...newArr]);
											} else if (batch?.length === 1) {
												newArr[i].batchNumber = v;
												newArr[i].atomId = batch[0].atomId;
												setFieldValue(
													"products",
													newArr.map((row) => ({
														productCategory: row.type,
														productID: row.id,
														productQuantity: row.productQuantity,
														batchNumber: row.batchNumber,
														productName: row.name,
														manufacturer: row.manufacturer,
														quantity: row.quantity,
														unitofMeasure: row.unitofMeasure,
														atomId: row.atomId,
													})),
												);
												setAddProducts(() => [...newArr]);
											}
										}}
										enableDelete={true}
										onRemoveRow={(index) => {
											// const prodIndex = products.findIndex(
											//   (p) => p.id === addProducts[index].id
											// );
											let newArray = [...products];
											newArray[index] = {
												...newArray[index],
												isSelected: false,
											};
											addProducts.splice(index, 1);
											setProducts((prod) => [...newArray]);

											let newArr = [...addProducts];
											if (newArr.length > 0)
												setFieldValue(
													"products",
													newArr.map((row) => ({
														productCategory: row.type,
														productID: row.id,
														productQuantity: row.productQuantity,
														batchNumber: row.batchNumber,
														productName: row.name,
														manufacturer: row.manufacturer,
														quantity: row.quantity,
														unitofMeasure: row.unitofMeasure,
														atomId: row.atomId,
													})),
												);
											else setFieldValue("products", []);
											setAddProducts((prod) => [...newArr]);
										}}
										handleProductChange={(index, item) => {
											addProducts.splice(index, 1, item);
											let newArr = [...addProducts];
											setFieldValue(
												"products",
												newArr.map((row) => ({
													productId: row.id,
													batchNumber: row.batchNumber,
													id: row.id,
													productQuantity: "",
													quantity: "",
													name: row.name,
													type: row.type,
													manufacturer: row.manufacturer,
													unitofMeasure: row.unitofMeasure,
													atomId: row.atomId,
												})),
											);
											setAddProducts((prod) => [...newArr]);

											const prodIndex = products.findIndex((p) => p.id === item.id);
											let newArray = [...products];
											newArray[prodIndex] = {
												...newArray[prodIndex],
												isSelected: true,
											};
											// setProducts(prod => [...newArray]);
										}}
										handleLabelIdChange={handleLabelIdChange}
										handleCategoryChange={onCategoryChange}
									/>
									<div className="d-flex justify-content-between">
										<button
											type="button"
											className="btn btn-white bg-white shadow-radius mt-3 font-bold"
											onClick={() => {
												let newArr = {
													productName: "",
													manufacturer: "",
													productQuantity: "",
													batchNumber: "",
													atomId: "",
												};
												setAddProducts((prod) => [...prod, newArr]);
											}}
										>
											+<span> {t("add_another_product")}</span>
										</button>
									</div>
								</>
							)}
							{/* <div className="table productTable mt-2">
                <div className="rTable">
                  <div className="rTableHeading">
                    <div className="rTableHead pro">Product Name</div>

                    <div className="rTableHead pro">Manufacturer</div>

                    <div className="rTableHead pro">Quantity</div>
                  </div>

                </div>
              </div> */}
						</div>
						{errors.products && touched.products && (
							<span className="error-msg text-danger-DD">{errors.products}</span>
						)}
						<div className="d-flex justify-content-between">
							<div className="value">{productQuantity}</div>
							<div className="d-flex">
								<button
									type="button"
									className="btn btn-outline-primary font-bold mr-2"
									onClick={() => props.history.push("/shipments")}
								>
									{t("cancel")}
								</button>

								<button
									disabled={!FromLocationSelected}
									className="btn btn-orange fontSize20 font-bold"
								>
									<img src={Add} width="20" height="17" className="mr-2 mb-1" alt="" />
									<span>{t("create_shipment")}</span>
								</button>
							</div>
						</div>
					</form>
				)}
			</Formik>

			{openCreatedInventory && (
				<Modal
					close={() => closeModal()}
					size="modal-sm" //for other size's use `modal-lg, modal-md, modal-sm`
					confetti={true}
				>
					<ShipmentPopUp
						t={t}
						onHide={closeModal} //FailurePopUp
						{...modalProps}
					/>
				</Modal>
			)}

			{openShipmentFail && (
				<Modal
					close={() => closeModalFail()}
					size="modal-sm" //for other size's use `modal-lg, modal-md, modal-sm`
				>
					<ShipmentFailPopUp
						onHide={closeModalFail} //FailurePopUp
						{...modalProps}
						t={t}
						shipmentError={shipmentError}
					/>
				</Modal>
			)}
		</div>
	);
};

export default NewShipment;

/* {message && (
  <div className="d-flex justify-content-center mt-3"> <Alert severity="success"><AlertTitle>Success</AlertTitle>{message}</Alert></div>
)} 

{errorMessage && (
  <div className="d-flex justify-content-center mt-3"> <Alert severity="error"><AlertTitle>Error</AlertTitle>{errorMessage}</Alert></div>
)} */
