import React, { useEffect, useState } from "react";
import "./Filterbar.css";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import Slider from "@mui/material/Slider";
import { Autocomplete, TextField } from "@mui/material";
import { getOrgsForFilters } from "../../../actions/lastMileActions";
import {
  fetchAllRegions,
  fetchCountriesByRegion,
  fetchStateByCountry,
  fetchCitiesByState,
} from "../../../actions/productActions";

function valuetext(value) {
  return `${value}°C`;
}

export default function Filterbar(props) {
  const { tableType, filters, setFilters, t, resetFilters } = props;

  const [organizations, setOrganizations] = useState([""]);
  const [ageType, setAgeType] = useState("");

  const [yearRange, setYearRange] = useState([1, 150]);
  const [monthRange, setMonthRange] = useState([6, 11]);
  const [gender, setGender] = useState();

  const [allregions, setallregions] = useState([]);
  const [allCountries, setallCountries] = useState([]);
  const [allState, setallState] = useState([]);
  const [allCity, setallCity] = useState([]);

  const [region, setregion] = useState("");
  const [country, setcountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [organization, setOrganization] = useState("");

  useEffect(() => {
    let data = {};
    if (ageType) {
      data.ageType = ageType;
      if (ageType === "months") {
        if (monthRange.length > 1) {
          data.minAge = monthRange[0];
          data.maxAge = monthRange[1];
        }
      } else {
        if (yearRange.length > 1) {
          data.minAge = yearRange[0];
          data.maxAge = yearRange[1];
        }
      }
    }

    if (gender) {
      data.gender = gender;
    }
    if (city && city !== "") {
      data.city = city;
    }

    if (organization && organization !== "") {
      data.organisation = organization;
    }
    setFilters(data);
  }, [gender, monthRange, yearRange, city, organization, ageType, setFilters]);

  useEffect(() => {
    if (tableType === "units" && filters.gender) {
      const { gender, minAge, maxAge, ...newFilters } = filters;
      setFilters(newFilters);
    }
  }, [filters, setFilters, tableType]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let result = await getOrgsForFilters();
        if (result?.data?.success) {
          setOrganizations(result.data.data);
        }
        let arr = await fetchAllRegions();
        setallregions(arr.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Reset filter values
    handleClear("city");
    handleClear("organization");
    handleClear("gender");
    handleClear("age");
  }, [resetFilters]);

  const handleClear = (name) => {
    switch (name) {
      case "city": {
        setCity(null);
        setregion("");
        setcountry("");
        setState("");
        setCity("");
        break;
      }
      case "organization": {
        setOrganization(null);
        break;
      }
      case "gender": {
        setGender(null);
        break;
      }
      case "age": {
        setAgeType("");
        setMonthRange([6, 11]);
        setYearRange([1, 150]);
        break;
      }
      default:
        setCity(null);
        break;
    }
  };

  const handleMonthChange = (event, newValue) => {
    setMonthRange(newValue);
  };

  const handleYearChange = (event, newValue) => {
    setYearRange(newValue);
  };

  async function fetchAllState(id) {
    let res = await fetchStateByCountry(id);
    setallState(res.data);
  }

  async function fetchAllCountries(id) {
    let res = await fetchCountriesByRegion(id);
    setallCountries(res.data);
  }

  async function fetchAllCity(id) {
    let res = await fetchCitiesByState(id);
    setallCity(res.data);
  }

  function search(name, myArray) {
    for (var i = 0; i < myArray.length; i++) {
      if (myArray[i].name === name) {
        return myArray[i].id;
      }
    }
  }

  return (
    <section className='Filterbar--container'>
      <div className='Filterbar--header'>
        <h1 className='vl-subheading f-500 vl-black'>{t("filter")}</h1>
      </div>
      <div className='Filterbar--body'>
        {tableType !== "units" && (
          <div className='Filterbar--filterCard'>
            <div className='filterCard-header'>
              <div className='filterCard-inner-header'>
                <p className='vl-body f-500 vl-grey-md'>{t("gender")}</p>
                <button
                  onClick={() => handleClear("gender")}
                  className='filter-clear-btn'
                >
                  {t("clear")}
                </button>
              </div>
              <p className='vl-note f-400 vl-grey-xs'>{t("gender_msg")}</p>
            </div>
            <div className='filterCard-body side-space border-btm'>
              <FormControl>
                <RadioGroup
                  className='mui-custom-radio-group'
                  name='radio-buttons-group'
                  onClick={(event) => setGender(event.target.value)}
                >
                  <FormControlLabel
                    name='gender'
                    checked={gender === "MALE"}
                    value='MALE'
                    id='male'
                    control={<Radio />}
                    label={t("male")}
                  />
                  <FormControlLabel
                    name='gender'
                    checked={gender === "FEMALE"}
                    value='FEMALE'
                    id='female'
                    control={<Radio />}
                    label={t("female")}
                  />
                  <FormControlLabel
                    name='gender'
                    checked={gender === "OTHERS"}
                    value='OTHERS'
                    id='others'
                    control={<Radio />}
                    label={t("others")}
                  />
                </RadioGroup>
              </FormControl>
            </div>
          </div>
        )}
        <div className='Filterbar--filterCard'>
          <div className='filterCard-header'>
            <div className='filterCard-inner-header'>
              <p className='vl-body f-500 vl-grey-md'>{t("city")}</p>
              <button
                onClick={() => handleClear("city")}
                className='filter-clear-btn'
              >
                Clear
              </button>
            </div>
            <p className='vl-note f-400 vl-grey-xs'>{t("city_msg")}</p>
          </div>
          <div className='filterCard-body border-btm'>
            <Autocomplete
              value={region}
              onChange={(event, newValue) => {
                fetchAllCountries(newValue);
                setregion(newValue);
                setcountry("");
                setState("");
                setCity("");
              }}
              id='controllable-states-demo'
              options={allregions}
              style={{ marginTop: 10 }}
              disablePortal
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("select") + " " + t("region")}
                />
              )}
            />
            <Autocomplete
              value={country}
              onChange={(event, newValue) => {
                let v = search(newValue, allCountries);
                fetchAllState(v);
                setcountry(newValue);
                setState("");
                setCity("");
              }}
              id='controllable-states-demo'
              options={allCountries.map((option) => option.name)}
              style={{ marginTop: 10 }}
              disablePortal
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("select") + " " + t("country")}
                />
              )}
            />
            <Autocomplete
              value={state}
              onChange={(event, newValue) => {
                let v = search(newValue, allState);
                fetchAllCity(v);
                setState(newValue);
                setCity("");
              }}
              id='controllable-states-demo'
              options={allState.map((option) => option.name)}
              style={{ marginTop: 10 }}
              disablePortal
              fullWidth
              renderInput={(params) => (
                <TextField {...params} label={t("select") + " " + t("state")} />
              )}
            />
            <Autocomplete
              onChange={(event, newValue) => {
                setCity(newValue);
              }}
              id='controllable-states-demo'
              options={allCity.map((Option) => Option.name)}
              style={{ marginTop: 10 }}
              disablePortal
              fullWidth
              value={city}
              renderInput={(params) => (
                <TextField {...params} label={t("select") + " " + t("city")} />
              )}
            />
          </div>
        </div>

        {props.user?.type === "GoverningBody" && (
          <div className='Filterbar--filterCard'>
            <div className='filterCard-header'>
              <div className='filterCard-inner-header'>
                <p className='vl-body f-500 vl-grey-md'>{t("organisation")}</p>
                <button
                  onClick={() => handleClear("organization")}
                  className='filter-clear-btn'
                >
                  Clear
                </button>
              </div>
              <p className='vl-note f-400 vl-grey-xs'>{t("org_msg")}</p>
            </div>
            <div className='filterCard-body border-btm'>
              <Autocomplete
                disablePortal
                fullWidth
                options={organizations}
                value={organization}
                onChange={(event, value) => setOrganization(value)}
                renderInput={(params) => (
                  <TextField {...params} label='Organization' />
                )}
              />
            </div>
          </div>
        )}

        {tableType !== "units" && (
          <div className='Filterbar--filterCard'>
            <div className='filterCard-header'>
              <div className='filterCard-inner-header'>
                <p className='vl-body f-500 vl-grey-md'>{t("age")}</p>
                <button
                  onClick={() => handleClear("age")}
                  className='filter-clear-btn'
                >
                  {t("clear")}
                </button>
              </div>
              <p className='vl-note f-400 vl-grey-xs'>{t("org_msg")}</p>
            </div>
            <div className='filterCard-body side-space'>
              <FormControl>
                <RadioGroup
                  className='mui-custom-radio-group'
                  defaultValue='range'
                  name='radio-buttons-group'
                  value={ageType}
                  onClick={(event) => setAgeType(event.target.value)}
                >
                  <FormControlLabel
                    checked={ageType === "months"}
                    value='months'
                    control={<Radio />}
                    label={t("month_range")}
                  />
                  <FormControlLabel
                    checked={ageType === "years"}
                    value='years'
                    control={<Radio />}
                    label={t("year_range")}
                  />
                </RadioGroup>
              </FormControl>
              {ageType === "months" ? (
                <div className='slider-select'>
                  <Slider
                    getAriaLabel={() => "Temperature range"}
                    value={monthRange}
                    onChange={handleMonthChange}
                    valueLabelDisplay='auto'
                    getAriaValueText={valuetext}
                    min={6}
                    max={11}
                  />
                </div>
              ) : (
                <div className='slider-select'>
                  <Slider
                    getAriaLabel={() => "Temperature range"}
                    value={yearRange}
                    onChange={handleYearChange}
                    valueLabelDisplay='auto'
                    getAriaValueText={valuetext}
                    min={1}
                    max={150}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
