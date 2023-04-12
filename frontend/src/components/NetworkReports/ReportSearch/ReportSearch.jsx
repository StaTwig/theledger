import React, { useState, useEffect } from "react";
import "./ReportSearch.css";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Controller, useForm } from "react-hook-form";
import { fetchCitiesByState, fetchCountriesByRegion, fetchStateByCountry } from "../../../actions/productActions";
import { useTranslation } from "react-i18next";

export default function ReportSearch({ updateSearchParams }) {  
  const { t } = useTranslation();

  const [allCountries, setAllCountries] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [allCities, setAllCities] = useState([]);

  async function getAllCities(state) {
    let cities = await fetchCitiesByState(state.id);
    setAllCities(cities.data);
  }

  useEffect(() => {
    async function getCountriesForAmericas() {
      let countries = await fetchCountriesByRegion("Americas");
      setAllCountries(countries.data);
      const costarica = countries.data.filter(
        (country) => country.name === "Costa Rica"
      );
      let states = await fetchStateByCountry(costarica[0].id);
      setAllStates(states.data);
    }
    getCountriesForAmericas();
  }, []);
  
  const {
    control,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm({
    country: "Costa Rica",
    state: "",
    city: "",
  });

  const onSubmit = (data) => {
    updateSearchParams(data);
  };

  return (
		<section className="ReportSearch_container">
			<h1 className="Report_page_title_ts">Search here for units</h1>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="main_searchbar_wrapper">
					<div className="search_icon_wrap">
						{/* <i class="fa-solid fa-magnifying-glass"></i> */}
					</div>
					<div className="input_hold bdr">
						<TextField
							value="Costa Rica"
							fullWidth
							variant="outlined"
							label={t("country")}
							InputProps={{
								readOnly: true,
							}}
							style={{ textAlign: "left" }}
						/>
					</div>
					<div className="input_hold bdr">
						<Controller
							name="state"
							control={control}
							render={({ field }) => (
								<Autocomplete
									fullWidth
									className="mi_report_autocomplete"
									options={allStates}
									getOptionLabel={(option) => option.name || ""}
									{...field}
									onChange={(event, value) => {
                    if(!value?.name) {
                      field.onChange("");
                      setAllCities([]);
                    } else {
                      field.onChange(value.name);
                      getAllCities(value);
                    } 
                    setValue("city", "");
									}}
									renderInput={(params) => (
										<TextField
											{...params}
											label={t("state")}
											error={Boolean(errors.state)}
											helperText={errors.state && "State is required!"}
										/>
									)}
								/>
							)}
						/>
					</div>
					<div className="input_hold">
						<Controller
							name="city"
							control={control}
							render={({ field }) => (
								<Autocomplete
									fullWidth
									options={allCities}
									getOptionLabel={(option) => option.name || ""}
									{...field}
									onChange={(event, value) => {
                    if(!value?.name) {
                      field.onChange("");
                    } else {
                      field.onChange(value.name);
                    }
									}}
									renderInput={(params) => (
										<TextField
											{...params}
											label={t("city")}
											error={Boolean(errors.city)}
											helperText={errors.city && "City is required!"}
										/>
									)}
								/>
							)}
						/>
					</div>
					<div className="null_space"></div>
					<button type="submit" className="result_search_button">
						Search
					</button>
				</div>
			</form>
		</section>
	);
}