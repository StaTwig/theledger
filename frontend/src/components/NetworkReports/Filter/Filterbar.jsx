import * as React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import Popper from "@mui/material/Popper";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Autocomplete, { autocompleteClasses } from "@mui/material/Autocomplete";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";
import Box from "@mui/material/Box";

const StyledAutocompletePopper = styled("div")(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: "none",
    margin: 0,
    color: "inherit",
    fontSize: 13,
  },
  [`& .${autocompleteClasses.listbox}`]: {
    backgroundColor: theme.palette.mode === "light" ? "#fff" : "#1c2128",
    padding: 0,
    [`& .${autocompleteClasses.option}`]: {
      minHeight: "auto",
      alignItems: "flex-start",
      padding: 8,
      borderBottom: `1px solid  ${
        theme.palette.mode === "light" ? " #eaecef" : "#30363d"
      }`,
      '&[aria-selected="true"]': {
        backgroundColor: "transparent",
      },
      [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]:
        {
          backgroundColor: theme.palette.action.hover,
        },
    },
  },
  [`&.${autocompleteClasses.popperDisablePortal}`]: {
    position: "relative",
  },
}));

function PopperComponent(props) {
  const { disablePortal, anchorEl, open, ...other } = props;
  return <StyledAutocompletePopper {...other} />;
}

PopperComponent.propTypes = {
  anchorEl: PropTypes.any,
  disablePortal: PropTypes.bool,
  open: PropTypes.bool.isRequired,
};

const StyledPopper = styled(Popper)(({ theme }) => ({
  border: `1px solid ${theme.palette.mode === "light" ? "#e1e4e8" : "#30363d"}`,
  boxShadow: `0 8px 24px ${
    theme.palette.mode === "light" ? "rgba(149, 157, 165, 0.2)" : "rgb(1, 4, 9)"
  }`,
  borderRadius: 6,
  width: 300,
  zIndex: theme.zIndex.modal,
  fontSize: 13,
  color: theme.palette.mode === "light" ? "#24292e" : "#c9d1d9",
  backgroundColor: theme.palette.mode === "light" ? "#fff" : "#1c2128",
}));

const StyledInput = styled(InputBase)(({ theme }) => ({
  padding: 10,
  width: "100%",
  borderBottom: `1px solid ${
    theme.palette.mode === "light" ? "#eaecef" : "#30363d"
  }`,
  "& input": {
    borderRadius: 4,
    backgroundColor: theme.palette.mode === "light" ? "#fff" : "#0d1117",
    padding: 8,
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    border: `1px solid ${
      theme.palette.mode === "light" ? "#eaecef" : "#30363d"
    }`,
    fontSize: 14,
    "&:focus": {
      boxShadow: `0px 0px 0px 3px ${
        theme.palette.mode === "light"
          ? "rgba(3, 102, 214, 0.3)"
          : "rgb(12, 45, 107)"
      }`,
      borderColor: theme.palette.mode === "light" ? "#0366d6" : "#388bfd",
    },
  },
}));

const Button = styled(ButtonBase)(({ theme }) => ({
  fontSize: 13,
  width: "100%",
  textAlign: "left",
  paddingBottom: 8,
  color: theme.palette.mode === "light" ? "#586069" : "#8b949e",
  fontWeight: 600,
  "&:hover,&:focus": {
    color: theme.palette.mode === "light" ? "#0366d6" : "#58a6ff",
  },
  "& span": {
    width: "100%",
  },
  "& svg": {
    width: 16,
    height: 16,
  },
}));

export default function Filterbar({
  title,
  fieldName,
  anchorEl,
  selectedColumn,
  handleClose,
  theme,
  options,
  selectedFilters,
  handleFilterUpdate,
}) {
  const open = Boolean(anchorEl) && fieldName === selectedColumn;

  return (
    <>
      <StyledPopper
        id={fieldName}
        open={open}
        anchorEl={anchorEl}
        placement='bottom-start'
      >
        <ClickAwayListener onClickAway={handleClose}>
          <div>
            <Box
              sx={{
                borderBottom: `1px solid ${
                  theme.palette.mode === "light" ? "#eaecef" : "#30363d"
                }`,
                padding: "8px 10px",
                fontWeight: 600,
              }}
            >
              <div className='filter_header_area'>
                <div> Filter {title}</div>
                <button
                  onClick={() => {
                    handleFilterUpdate(fieldName, "");
                    handleClose();
                  }}
                  className='ui_filter_clear_btn'
                >
                  Clear
                </button>
              </div>
            </Box>
            <Autocomplete
              open
              value={selectedFilters[fieldName]}
              onClose={(event, reason) => {
                if (reason === "escape") {
                  handleClose();
                }
              }}
              onChange={(event, newValue, reason) => {
                if (
                  event.type === "keydown" &&
                  event.key === "Backspace" &&
                  reason === "removeOption"
                ) {
                  return;
                }
                handleFilterUpdate(fieldName, newValue);
                handleClose();
              }}
              // disableCloseOnSelect
              PopperComponent={PopperComponent}
              options={options}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Box
                    sx={{
                      flexGrow: 1,
                      "& span": {
                        color:
                          theme.palette.mode === "light"
                            ? "#586069"
                            : "#8b949e",
                      },
                    }}
                  >
                    {option}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <StyledInput
                  ref={params.InputProps.ref}
                  inputProps={params.inputProps}
                  autoFocus
                  placeholder='Filter Options'
                />
              )}
              // getOptionLabel={(option) => option}
            />
          </div>
        </ClickAwayListener>
      </StyledPopper>
    </>
  );
}

// From https://github.com/abdonrd/github-labels
