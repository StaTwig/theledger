const mongoose = require("mongoose");
const DoseSchema = new mongoose.Schema(
	{
		id: {
			type: String,
			required: true,
		},
		vaccineVialId: {
			type: String,
			required: true,
		},
		age: {
			type: Number,
			default: 0,
		},
		ageMonths: {
			type: Number,
			default: 0,
		},
		dob: Date,
		gender: {
			type: String,
			required: true,
			enum: ["MALE", "FEMALE", "OTHERS"],
		},
		createdDateString: String,
	},
	{ timestamps: true },
);

module.exports = mongoose.model("dose", DoseSchema);