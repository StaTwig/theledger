import React, { useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import { Pagination } from "@mui/material";
import UsersRow from "./UsersRow";
import { getOrgUsers } from "../../../../actions/organisationActions";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";

export default function UsersTable(props) {
	const dispatch = useDispatch();
	const {
		defaultRoles,
		t,
		refetch,
		userStatus,
		searchKey,
	} = props;

	const [users, setUsers] = useState([]);
	const [uniqueUsers, setUniqueUsers] = useState([]);
	const [refetchOnEdit, toggleRefetchOnEdit] = useState(false);
	// const { users } = useSelector((state) => state.organisationReducer);

	const uniqueIds = new Set();

	useEffect(() => {
		const filteredUsers = users?.filter((element) => {
			const isDuplicate = uniqueIds.has(element.id);

			uniqueIds.add(element.id);

			if (!isDuplicate) {
				return true;
			}

			return false;
		});
		if (filteredUsers?.length) setUniqueUsers([...filteredUsers]);
		else setUniqueUsers([]);
	}, [users]);

	const [page, setPage] = React.useState(1);
	const [rowsPerPage, setRowsPerPage] = React.useState(10);
	const [totalCount, setTotalCount] = useState(0);
	useEffect(async () => {
		let res = await dispatch(
			getOrgUsers(
				`skip=${
					(page - 1) * 10
				}&limit=${rowsPerPage}&status=${userStatus}&searchKey=${searchKey}`,
			),
		);
		setUsers(res.paginatedResults);
		setTotalCount(res.totalCount);
	}, [dispatch, page, userStatus, searchKey, rowsPerPage, props.tableFlag, refetch, refetchOnEdit]);

	const handleChangePage = (event, newPage) => {
		if (newPage > 1) setPage(newPage);
		else setPage(1);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	return (
		<TableContainer>
			<Table sx={{ minWidth: 992 }} aria-label="simple table" className="organization-table">
				<TableHead className="organization-thead">
					<TableRow className="organization-tr">
						<TableCell>
							<h1 className="vl-note f-500 vl-royal">{t("user_name")}</h1>
						</TableCell>
						<TableCell>
							<h1 className="vl-note f-500 vl-royal">{t("role")}</h1>
						</TableCell>
						<TableCell>
							<h1 className="vl-note f-500 vl-royal">{t("email")}</h1>
						</TableCell>
						<TableCell>
							<h1 className="vl-note f-500 vl-royal">{t("phone_no")}</h1>
						</TableCell>
						<TableCell>
							<h1 className="vl-note f-500 vl-royal">{t("location")}</h1>
						</TableCell>
						<TableCell>
							<h1 className="vl-note f-500 vl-royal">{t("status")}</h1>
						</TableCell>
						<TableCell>
							<h1 className="vl-note f-500 vl-royal">{t("created_on")}</h1>
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody className="organization-tbody">
					{uniqueUsers.map((rows, index) => (
						<UsersRow
							t={t}
							key={rows.id}
							rows={rows}
							index={index}
							defaultRoles={defaultRoles}
							refetchOnEdit={refetchOnEdit}
							toggleRefetchOnEdit={toggleRefetchOnEdit}
						/>
					))}
				</TableBody>
			</Table>
			<div className="mi_custom_pagination_wrapper">
				<Pagination
					count={Math.ceil(totalCount / rowsPerPage)}
					page={page}
					onChange={handleChangePage}
					shape="rounded"
				/>
			</div>
		</TableContainer>
	);
}
