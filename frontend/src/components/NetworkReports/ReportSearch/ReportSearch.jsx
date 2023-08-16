import React, { useState, useEffect } from "react";
import "./ReportSearch.css";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Controller, useForm } from "react-hook-form";
import {
  fetchCitiesByState,
  fetchCountriesByRegion,
  fetchStateByCountry,
  fetchAllRegions,
} from "../../../actions/productActions";
import { useTranslation } from "react-i18next";

export default function ReportSearch({ updateSearchParams }) {
  const { t } = useTranslation();
  const [allRegions, setAllRegions] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [allCities, setAllCities] = useState([]);

  async function getAllRegions() {
    let regions = await fetchAllRegions();
    setAllRegions(regions.data);
  }

  async function getAllCountries(region) {
    let countries = await fetchCountriesByRegion(region);
    setAllCountries(countries.data);
  }

  async function getAllStates(country) {
    let states = await fetchStateByCountry(country.id);
    setAllStates(states.data);
  }

  async function getAllCities(state) {
    const cities = await fetchCitiesByState(state.id);
    setAllCities(cities.data);
  }

  async function getAllStates(country) {
    const states = await fetchStateByCountry(country.id);
    setAllStates(states.data);
  }

  async function getAllCountries(region) {
    const countries = await fetchCountriesByRegion(region);
    setAllCountries(countries.data);
  }

  useEffect(() => {
    getAllRegions();
  }, []);

  const {
    control,
    setValue,
    watch,
    formState: { errors },
    handleSubmit,
  } = useForm({
    region: "",
    country: "",
    state: "",
    city: "",
  });

  const onSubmit = (data) => {
    updateSearchParams(data);
  };

  return (
    <section className='ReportSearch_container'>
      <h1 className='Report_page_title_ts'>{t("search_here_for_units")}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className='main_search_form'>
        <div className='main_searchbar_wrapper'>
          <div className='search_icon_wrap'>
            <i className='fa-solid fa-magnifying-glass'></i>
          </div>
          <div className='input_hold bdr'>
            <Controller
              name='region'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  className='mi_report_autocomplete'
                  options={allRegions}
                  getOptionLabel={(option) => option || ""}
                  {...field}
                  onChange={(event, value) => {
                    if (!value) {
                      field.onChange("");
                      setAllCountries([]);
                      setAllStates([]);
                      setAllCities([]);
                      updateSearchParams({
                        region: "",
                        country: "",
                        state: "",
                        city: "",
                      });
                    } else {
                      field.onChange(value);
                      getAllCountries(value);
                      setAllStates([]);
                      setAllCities([]);
                    }
                    setValue("country", "");
                    setValue("state", "");
                    setValue("city", "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t("region")}
                      error={Boolean(errors.state)}
                      helperText={errors.state && "Region is required!"}
                    />
                  )}
                />
              )}
            />
          </div>
          <div className='input_hold bdr'>
            <Controller
              name='country'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  className='mi_report_autocomplete'
                  options={allCountries}
                  getOptionLabel={(option) => option.name || ""}
                  {...field}
                  onChange={(event, value) => {
                    if (!value?.name) {
                      field.onChange("");
                      setAllStates([]);
                      setAllCities([]);
                      updateSearchParams({ country: "", state: "", city: "" });
                    } else {
                      field.onChange(value.name);
                      getAllStates(value);
                      setAllCities([]);
                    }
                    setValue("city", "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t("country")}
                      error={Boolean(errors.state)}
                      helperText={errors.state && "Country is required!"}
                    />
                  )}
                />
              )}
            />
          </div>
          <div className='input_hold bdr'>
            <Controller
              name='state'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  className='mi_report_autocomplete'
                  options={allStates}
                  getOptionLabel={(option) => option.name || ""}
                  {...field}
                  onChange={(event, value) => {
                    if (!value?.name) {
                      field.onChange("");
                      setAllCities([]);
                      updateSearchParams({ state: "", city: "" });
                    } else {
                      field.onChange(value.name);
                      getAllCities(value);
                    }
                    setValue("city", "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t("state")}
                      error={Boolean(errors.state)}
                      helperText={errors.state && "State is required!"}
                    />
                  )}
                />
              )}
            />
          </div>
          <div className='input_hold'>
            <Controller
              name='city'
              control={control}
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  className='mi_report_autocomplete'
                  options={allCities}
                  getOptionLabel={(option) => option.name || ""}
                  {...field}
                  onChange={(event, value) => {
                    if (!value?.name) {
                      field.onChange("");
                      updateSearchParams({ city: "" });
                    } else {
                      field.onChange(value.name);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t("city")}
                      error={Boolean(errors.city)}
                      helperText={errors.city && "City is required!"}
                    />
                  )}
                />
              )}
            />
          </div>
          <div className='null_space'></div>
          <button type='submit' className='result_search_button'>
            {t("search")}
          </button>
        </div>
      </form>
    </section>
  );
}
