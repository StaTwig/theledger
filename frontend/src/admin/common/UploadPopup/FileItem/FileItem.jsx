import React from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faFileAlt,
//   faSpinner,
//   faTrash,
// } from "@fortawesome/free-solid-svg-icons";
import "./FileItem.scss";

const FileItem = ({ file }) => {
  return (
    <>
      {file.name ? (
        <li className="file-item" key={file.name}>
          <i className="fa-solid fa-file-lines"></i>
          <p>{file.name}</p>
        </li>
      ) : null}
    </>
  );
};

export default FileItem;
