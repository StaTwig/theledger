import React, { useState, useEffect } from "react";
import { LineChart } from "react-chartkick";
import "chartkick/chart.js";
import "./style.scss";
import ArrowBack from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForward from "@mui/icons-material/ArrowForwardIosRounded";
import { temperatureGraph } from "../../actions/shipmentActions";

const Chart = (props) => {
  const [avg, setAvg] = useState(null);
  const [intial, setInitial] = useState(null);
  const [min, setMin] = useState(4);
  const [max, setMax] = useState(40);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState(false);
  useEffect(() => {
    async function fetchAvgTemperature() {
      const result = await temperatureGraph(props.shipmentId, page);
      setAvg(result.data.metaData.avg);
      setInitial(result.data.graph);
    }
    fetchAvgTemperature();
  }, [page, props.shipmentId]);
  const handlePrevHistory = () => {
    setPage(parseInt(page) + 1);
  };
  const handleNextHistory = () => {
    setPage(parseInt(page) - 1);
  };
  async function fetchsData(success, fail) {
    const result = await temperatureGraph(props.shipmentId, page);
    if (result.success) {
      setPage(result.data.page);
      setNextPage(result.data.nextPage);
      if (min > result.data.metaData.min) {
        setMin(result.data.metaData.min);
      }
      if (max < result.data.metaData.max) {
        setMax(result.data.metaData.max);
      }
      success(result.data.graph);
    } else {
      fail(result.message);
    }
  }
  const randomData = [];
  const generateRandomData = (success, fail) => {
    for (let i = 1; i < 8; i++) {
      randomData.push([new Date().toISOString(), Math.floor(Math.random() * (28 - 18 + 1)) + 18]);
    }
    randomData.shift()
    setAvg(Math.floor(Math.random() * (22 - 20 + 1)) + 20)
    success(randomData);
  };
  return (
    <>
      <div className='row mb-4 mt-0'>
        <div
          className='col panel commonpanle align-middle'
          style={{ height: "320px" }}
        >
          {avg && !isNaN(avg) ? (
            <h6 className='panel-title pl-2'>
              Latest Average Temperature: {parseInt(avg) + " °C" || "N/A"}
            </h6>
          ) : null}
          <div className='d-flex justify-content-between mb-4 p-relative'>
            {nextPage ? (
              <div
                className='icon-container-alt left-arrow'
                onClick={handlePrevHistory}
              >
                <ArrowBack className='icon-gmr' />
              </div>
            ) : null}
            {page > 1 ? (
              <div
                className='icon-container-alt right-arrow'
                onClick={handleNextHistory}
              >
                <ArrowForward className='icon-gmr' />
              </div>
            ) : null}
          </div>
          <LineChart
            colors={["#FA7923", "#666"]}
            id='users-chart'
            height='240px'
            ytitle='Temperature  °C'
            xtitle='Time'
            min={min}
            max={max}
            precision={4}
            data={generateRandomData}
            refresh={4}
          />
        </div>
      </div>
    </>
  );
};
export default Chart;
