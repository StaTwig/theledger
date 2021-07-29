// Code generated by go-swagger; DO NOT EDIT.

package certificate_revoked

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"io"
	"net/http"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/runtime"
	"github.com/go-openapi/runtime/middleware"
)

// NewCertificateRevokedParams creates a new CertificateRevokedParams object
// no default values defined in spec.
func NewCertificateRevokedParams() CertificateRevokedParams {

	return CertificateRevokedParams{}
}

// CertificateRevokedParams contains all the bound params for the certificate revoked operation
// typically these are obtained from a http.Request
//
// swagger:parameters certificateRevoked
type CertificateRevokedParams struct {

	// HTTP Request Object
	HTTPRequest *http.Request `json:"-"`

	/*
	  Required: true
	  In: body
	*/
	Body interface{}
}

// BindRequest both binds and validates a request, it assumes that complex things implement a Validatable(strfmt.Registry) error interface
// for simple values it will use straight method calls.
//
// To ensure default values, the struct must have been initialized with NewCertificateRevokedParams() beforehand.
func (o *CertificateRevokedParams) BindRequest(r *http.Request, route *middleware.MatchedRoute) error {
	var res []error

	o.HTTPRequest = r

	if runtime.HasBody(r) {
		defer r.Body.Close()
		var body interface{}
		if err := route.Consumer.Consume(r.Body, &body); err != nil {
			if err == io.EOF {
				res = append(res, errors.Required("body", "body", ""))
			} else {
				res = append(res, errors.NewParseError("body", "body", "", err))
			}
		} else {
			// no validation on generic interface
			o.Body = body
		}
	} else {
		res = append(res, errors.Required("body", "body", ""))
	}
	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}
