import React from "react";

import { Bar } from "react-chartjs-2";

export default function BarChart() {
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
  const data = {
    labels,
    datasets: [
      {
        label: "Dataset 1",
        data: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "20", "26"],
        backgroundColor: "#F07217",
      },
      {
        label: "Dataset 2",
        data: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "20", "36"],
        backgroundColor: "#0070E1",
      },
    ],
  };

  return <Bar options={options} data={data} />;
}
