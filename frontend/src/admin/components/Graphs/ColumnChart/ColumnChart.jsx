import React from "react";

import { Bar } from "react-chartjs-2";

export default function ColumnChart({ color }) {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: true,
        },
      },
    },
  };

  const labels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const data1 = {
    labels,
    datasets: [
      {
        label: "Dataset 1",
        data: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "20", "26"],
        backgroundColor: "#1975E3",
      },
    ],
  };

  const labels2 = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const data2 = {
    labels2,
    datasets: [
      {
        label: "Dataset 1",
        data: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "20", "26"],
        backgroundColor: "#1975E3",
      },
    ],
  };

  return (
    <>
      {color === "1" && <Bar options={options} data={data1} />}
      {color === "2" && <Bar options={options} data={data1} />}
    </>
  );
}
