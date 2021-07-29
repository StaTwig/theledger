// Code generated by go-swagger; DO NOT EDIT.

package vaccination

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"

	"github.com/divoc/api/swagger_gen/models"
)

// GetPreEnrollmentsForFacilityOKCode is the HTTP code returned for type GetPreEnrollmentsForFacilityOK
const GetPreEnrollmentsForFacilityOKCode int = 200

/*GetPreEnrollmentsForFacilityOK OK

swagger:response getPreEnrollmentsForFacilityOK
*/
type GetPreEnrollmentsForFacilityOK struct {

	/*
	  In: Body
	*/
	Payload []*models.Enrollment `json:"body,omitempty"`
}

// NewGetPreEnrollmentsForFacilityOK creates GetPreEnrollmentsForFacilityOK with default headers values
func NewGetPreEnrollmentsForFacilityOK() *GetPreEnrollmentsForFacilityOK {

	return &GetPreEnrollmentsForFacilityOK{}
}

// WithPayload adds the payload to the get pre enrollments for facility o k response
func (o *GetPreEnrollmentsForFacilityOK) WithPayload(payload []*models.Enrollment) *GetPreEnrollmentsForFacilityOK {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the get pre enrollments for facility o k response
func (o *GetPreEnrollmentsForFacilityOK) SetPayload(payload []*models.Enrollment) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *GetPreEnrollmentsForFacilityOK) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(200)
	payload := o.Payload
	if payload == nil {
		// return empty array
		payload = make([]*models.Enrollment, 0, 50)
	}

	if err := producer.Produce(rw, payload); err != nil {
		panic(err) // let the recovery middleware deal with this
	}
}
