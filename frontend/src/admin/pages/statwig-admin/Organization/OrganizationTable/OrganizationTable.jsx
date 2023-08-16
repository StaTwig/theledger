import React, { useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import OrganizationRow from "./OrganizationRow";
import { TablePagination } from "@mui/material";
import { getOrgs, updateOrg } from "../../../../actions/organisationActions";
import { useDispatch, useSelector } from "react-redux";

export default function OrganizationTable({
  searchOrgByName,
  orgStatus,
  tableFlag,
  t,
  updateStatusFlag,
  setUpdateStatusFlag,
}) {
  const dispatch = useDispatch();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [refresh, toggleRefresh] = React.useState(false);

  const { list } = useSelector((state) => state.organisationReducer);

  useEffect(() => {
    dispatch(
      getOrgs(
        `skip=${
          page * 10
        }&limit=${rowsPerPage}&status=${orgStatus}&orgName=${searchOrgByName}`,
      ),
    );
  }, [dispatch, orgStatus, page, refresh, rowsPerPage, searchOrgByName]);

  useEffect(() => {
    setPage(0);
    dispatch(
      getOrgs(
        `skip=${0}&limit=${rowsPerPage}&status=${orgStatus}&orgName=${searchOrgByName}`,
      ),
    );
  }, [rowsPerPage, tableFlag, orgStatus, searchOrgByName, dispatch]);

  const modifyOrg = async (data) => {
    const result = await updateOrg(data.org ? data.org : data);
    if (result.status !== 200) {
      alert(result.data.data.message);
    } else {
      toggleRefresh(!refresh);
      setUpdateStatusFlag(!updateStatusFlag);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <TableContainer>
      <Table
        sx={{ minWidth: 992 }}
        aria-label='simple table'
        className='organization-table'
      >
        <TableHead className='organization-thead'>
          <TableRow className='organization-tr'>
            <TableCell>
              <h1 className='vl-note f-500 vl-blue'>
                {t("organization_name")}
              </h1>
            </TableCell>
            <TableCell>
              <h1 className='vl-note f-500 vl-blue'>
                {t("organization_type")}
              </h1>
            </TableCell>
            <TableCell>
              <h1 className='vl-note f-500 vl-blue'>{t("total_user")}</h1>
            </TableCell>
            <TableCell>
              <h1 className='vl-note f-500 vl-blue'>{t("all_loc")}</h1>
            </TableCell>
            <TableCell>
              <h1 className='vl-note f-500 vl-blue'>{t("country")}</h1>
            </TableCell>
            <TableCell>
              <h1 className='vl-note f-500 vl-blue'>{t("status")}</h1>
            </TableCell>
            <TableCell>
              <h1 className='vl-note f-500 vl-blue'>{t("created_on")}</h1>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody className='organization-tbody'>
          {list.map((rows, index) => (
            <OrganizationRow
              modifyOrg={modifyOrg}
              key={rows.id}
              rows={rows}
              index={index}
            />
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component='div'
        count={list?.[0]?.totalCount || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
}
