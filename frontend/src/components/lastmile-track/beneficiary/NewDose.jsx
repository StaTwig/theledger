import React from "react";
import { TextField, Autocomplete } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import {
  vaccinateIndividual,
  updateVaccinationIndividual,
} from "../../../actions/lastMileActions";
import { useTranslation } from "react-i18next";
import Radio from "@mui/material/Radio";

export default function NewDose(props) {
  const {
    vaccineVialId,
    warehouseId,
    productId,
    batchNumber,
    atomId,
    defaultValues,
    setDefaultValues,
    setOpen,
    count,
    setcount,
  } = props;
  const { t } = useTranslation();
  const ageInMonths = defaultValues?.ageMonths > 0;
  const [selectedValue, setSelectedValue] = React.useState(
    ageInMonths || false
  );

  const [isDisabled, setIsDisabled] = React.useState(false);


  const handleChange = (event) => {
    console.log(selectedValue, event.target.value);
    setSelectedValue(event.target.value === "true" ? true : false);
    console.log(selectedValue);
  };

  const {
    control,
    formState: { errors },
    handleSubmit,
    getValues,
  } = useForm({
    defaultValues: {
      gender:
        { value: defaultValues?.gender, display: defaultValues?.gender } || "",
      age:
        defaultValues?.ageMonths > 0
          ? defaultValues.ageMonths
          : defaultValues?.age || "",
    },
  });

  const RewardCall = (values) => {
    newDose(values);
    setcount(count + 10);
    setOpen(true);
  };

  const newDose = async (values) => {
    setIsDisabled(true);
    try {
      const data = {
        vaccineVialId: vaccineVialId,
        warehouseId: warehouseId,
        productId: productId,
        batchNumber: batchNumber,
        atomId: atomId,
        gender: values.gender.value,
        age: selectedValue ? 0 : parseInt(values.age),
        ageMonths: selectedValue ? parseInt(values.age) : 0,
      };
      // Call vaccinate api
      if (defaultValues.update) {
        const result = await updateVaccinationIndividual({
          doseId: defaultValues.doseId,
          update: data,
        });
        setDefaultValues({});
        if (result.data.success) {
          props.newVaccination(result.data.data);
        } else {
          throw new Error(result.data.message);
        }
      } else {
        const result = await vaccinateIndividual(data);
        if (result.data.success) {
          props.newVaccination(result.data.data);
        } else {
          throw new Error(result.data.message);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const genderOptions = [
    { value: "MALE", display: t("male").toUpperCase() },
    { value: "FEMALE", display: t("female").toUpperCase() },
    { value: "OTHERS", display: t("others").toUpperCase() },
  ];

  return (
    <section className="Beneficiary--Add-wrapper">
      <form onSubmit={handleSubmit(RewardCall)}>
        <div className="Beneficiary--Add-inner-wrapper">
          <h1 className="vl-subheading f-700 vl-grey-md">Personal Details</h1>
          <div className="Add-form-space">
            <Controller
              name="gender"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Autocomplete
                  fullWidth
                  options={genderOptions}
                  getOptionLabel={(option) => option.display || ""}
                  defaultValue={genderOptions.find(
                    (elem) => elem.value === getValues().gender
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("gender")}
                      error={Boolean(errors.gender)}
                      helperText={
                        Boolean(errors.gender) && "Gender is reqiured!"
                      }
                    />
                  )}
                  {...field}
                  onChange={(event, value) => {
                    field.onChange(value);
                  }}
                />
              )}
            />
            <Controller
              name="age"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  type="number"
                  fullWidth
                  variant="outlined"
                  label={t("age")}
                  {...field}
                  inputProps={{
                    inputMode: "numeric",
                    min: selectedValue ? "6" : "1",
                    max: selectedValue ? "11" : "150",
                  }}
                  error={Boolean(errors.age)}
                  helperText={Boolean(errors.age) && "Age is required!"}
                  // InputProps={{
                  // 	inputProps: {
                  // 		min: selectedValue ? 6 : 1,
                  // 		max: selectedValue ? 12 : 150,
                  // 	},
                  // }}
                />
              )}
            />
            <div className="radio-btn-group">
              <div className="radio-btn-card">
                <Radio
                  checked={selectedValue === false}
                  onChange={handleChange}
                  value={false}
                  name="radio-buttons"
                  inputProps={{ "aria-label": "A" }}
                />
                <p className="mi-body f-500">Years</p>
              </div>
              <p className="mi-note f-400">/</p>
              <div className="radio-btn-card">
                <Radio
                  checked={selectedValue === true}
                  onChange={handleChange}
                  value={true}
                  name="radio-buttons"
                  inputProps={{ "aria-label": "B" }}
                />
                <p className="mi-body f-500">Months</p>
              </div>
            </div>
          </div>
          <div className="Beneficiary--action">
            <button
              type="submit"
              disabled={isDisabled}
              className="vl-btn vl-btn-md vl-btn-primary"
            >
              {t("save")}
            </button>
          </div>
          <div className="Beneficiary--action">
            <button
              onClick={() => props.setLayoutType(1)}
              className="vl-btn vl-btn-md vl-btn-alert"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
