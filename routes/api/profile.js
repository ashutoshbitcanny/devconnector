const express = require("express");
const router = express.Router();
const passport = require("passport");

// Load Profile Model
const Profile = require("../../models/Profile");
// Load User Model
const User = require("../../models/User");

// Load Validation
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

router.get("/test", (req, res) => {
	res.json({ msg: "profile works!" });
});

//get profile of logged user
router.get(
	"/",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const errors = {};
		Profile.findOne({ user: req.user.id })
			.populate("user", ["name", "avatar"])
			.then(profile => {
				if (!profile) {
					errors.noprofile = "There is no profile for this user";
					return res.status(404).json(errors);
				}
				res.json(profile);
			})
			.catch(err => {
				res.status(404).json(err);
			});
	}
);

//get all profiles

router.post("/all", (req, res) => {
	const errors = {};
	Profile.find({})
		.populate("user", ["name", "avatar"])
		.then(profiles => {
			if ("!profiles") {
				errors.noprofile = "Profile not found";
				return res.status(404).json(errors);
			}
			res.json(profiles);
		})
		.catch(err => res.json(err));
});

//get profile by handle

router.get("/handle/:handle", (req, res) => {
	const errors = {};
	Profile.findOne({ handle: req.params.handle })
		.populate("user", ["name", "avatar"])
		.then(profile => {
			if (!profile) {
				errors.profile = "There is no profile";
				return res.status(404).json(errors);
			}
			res.json(profile);
		})
		.catch(err => res.json(err));
});

//get profile by user id

//get profile by handle

router.get("/user/:id", (req, res) => {
	const errors = {};
	Profile.findOne({ user: req.params.id })
		.populate("user", ["name", "avatar"])
		.then(profile => {
			if (!profile) {
				errors.profile = "There is no profile";
				return res.status(404).json(errors);
			}
			res.json(profile);
		})
		.catch(err => res.json(err));
});

//post profile
router.post(
	"/",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validateProfileInput(req.body);

		if (!isValid) return res.status(400).json(errors);
		const profileFields = {};
		profileFields.user = req.user.id;
		if (req.body.handle) profileFields.handle = req.body.handle;
		if (req.body.company) profileFields.company = req.body.company;
		if (req.body.website) profileFields.website = req.body.website;
		if (req.body.location) profileFields.location = req.body.location;
		if (req.body.bio) profileFields.bio = req.body.bio;
		if (req.body.status) profileFields.status = req.body.status;
		if (req.body.githubusername)
			profileFields.githubusername = req.body.githubusername;
		// Skills - Spilt into array
		if (typeof req.body.skills !== "undefined") {
			profileFields.skills = req.body.skills.split(",");
		}

		// Social
		profileFields.social = {};
		if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
		if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
		if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
		if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
		if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

		Profile.findOne({ user: req.user.id }).then(profile => {
			if (profile) {
				// Update
				Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				).then(profile => res.json(profile));
			} else {
				// Create

				// Check if handle exists
				Profile.findOne({ handle: profileFields.handle }).then(profile => {
					if (profile) {
						errors.handle = "That handle already exists";
						res.status(400).json(errors);
					}

					// Save Profile
					new Profile(profileFields).save().then(profile => res.json(profile));
				});
			}
		});
	}
);

//add exprience to profile
router.post(
	"/exprience",
	passport.authenticate("awt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validateExperienceInput(req.data);
		if (!isValid) return res.status(400).json(errors);
		Profile.findOne({ id: req.user.id }).then(profile => {
			if (!profile) {
				errors.noprofile = "No profile exists";
				return res.status(400).json(errors);
			}
			const {
				title,
				company,
				location,
				from,
				to,
				current,
				description
			} = req.body;
			const newExp = {
				title,
				company,
				location,
				from,
				to,
				current,
				description
			};
			profile.experience.unshift(newExp);
			profile.save().then(profile => res.json(profile));
		});
	}
);

//add education to profile
router.post(
	"/education",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { errors, isValid } = validateEducationInput(req.body);

		// Check Validation
		if (!isValid) {
			// Return any errors with 400 status
			return res.status(400).json(errors);
		}

		Profile.findOne({ user: req.user.id }).then(profile => {
			const newEdu = {
				school: req.body.school,
				degree: req.body.degree,
				fieldofstudy: req.body.fieldofstudy,
				from: req.body.from,
				to: req.body.to,
				current: req.body.current,
				description: req.body.description
			};

			// Add to edu array
			profile.education.unshift(newEdu);

			profile.save().then(profile => res.json(profile));
		});
	}
);

//delete experience from user
router.delete(
	"/experience/:exp_id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		Profile.findOne({ user: req.user.id })
			.then(profile => {
				// Get remove index
				const removeIndex = profile.experience
					.map(item => item.id)
					.indexOf(req.params.exp_id);

				// Splice out of array
				profile.experience.splice(removeIndex, 1);

				// Save
				profile.save().then(profile => res.json(profile));
			})
			.catch(err => res.status(404).json(err));
	}
);

//delete education from profile
router.delete(
	"/education/:edu_id",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		Profile.findOne({ user: req.user.id })
			.then(profile => {
				// Get remove index
				const removeIndex = profile.education
					.map(item => item.id)
					.indexOf(req.params.edu_id);

				// Splice out of array
				profile.education.splice(removeIndex, 1);

				// Save
				profile.save().then(profile => res.json(profile));
			})
			.catch(err => res.status(404).json(err));
	}
);

module.exports = router;