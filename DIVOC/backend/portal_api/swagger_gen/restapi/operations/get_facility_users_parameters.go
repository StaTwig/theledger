// Code generated by go-swagger; DO NOT EDIT.

package operations

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/runtime"
	"github.com/go-openapi/runtime/middleware"
	"github.com/go-openapi/strfmt"
)

// NewGetFacilityUsersParams creates a new GetFacilityUsersParams object
// no default values defined in spec.
func NewGetFacilityUsersParams() GetFacilityUsersParams {

	return GetFacilityUsersParams{}
}

// GetFacilityUsersParams contains all the bound params for the get facility users operation
// typically these are obtained from a http.Request
//
// swagger:parameters getFacilityUsers
type GetFacilityUsersParams struct {

	// HTTP Request Object
	HTTPRequest *http.Request `json:"-"`

	/*Facility Code required for controller
	  In: query
	*/
	FacilityCode *string
}

// BindRequest both binds and validates a request, it assumes that complex things implement a Validatable(strfmt.Registry) error interface
// for simple values it will use straight method calls.
//
// To ensure default values, the struct must have been initialized with NewGetFacilityUsersParams() beforehand.
func (o *GetFacilityUsersParams) BindRequest(r *http.Request, route *middleware.MatchedRoute) error {
	var res []error

	o.HTTPRequest = r

	qs := runtime.Values(r.URL.Query())

	qFacilityCode, qhkFacilityCode, _ := qs.GetOK("facilityCode")
	if err := o.bindFacilityCode(qFacilityCode, qhkFacilityCode, route.Formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

// bindFacilityCode binds and validates parameter FacilityCode from query.
func (o *GetFacilityUsersParams) bindFacilityCode(rawData []string, hasKey bool, formats strfmt.Registry) error {
	var raw string
	if len(rawData) > 0 {
		raw = rawData[len(rawData)-1]
	}

	// Required: false
	// AllowEmptyValue: false
	if raw == "" { // empty values pass all other validations
		return nil
	}

	o.FacilityCode = &raw

	return nil
}
