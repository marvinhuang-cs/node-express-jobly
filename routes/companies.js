const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const Company = require("../models/company");
const jsonschema = require("jsonschema");
const newCompany = require("../schemas/newCompany.json");
const updateCompany = require("../schemas/updateCompany.json");
const {authRequired} = require("../middleware/middlewareAuth");
const {ensureAdmin} = require("../middleware/middlewareAuth");

router.get("/", authRequired, async function(req, res, next){
    try {
        const companies = await Company.searchAll(req.query);
        return res.json({companies})

    } catch(err) {
        return next(err);
    }
})

router.post("/", ensureAdmin, async function(req, res, next){
    try {
        const validation = jsonschema.validate(req.body, newCompany);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const company = await Company.create(req.body);
        return res.status(201).json({company})

    } catch(err) {
        return next(err);
    }
})

router.get("/:handle", authRequired, async function(req, res, next){
    try {
        const company = await Company.search(req.params.handle);
        return res.json({company})

    } catch(err) {
        return next(err);
    }
})

router.patch("/:handle", ensureAdmin, async function(req, res, next){
    try {
        if (`handle` in req.body) {
            throw new ExpressError(`Cannot updated handle`, 400)
        }
        
        const validation = jsonschema.validate(req.body, updateCompany)
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const company = await Company.update(req.params.handle, req.body);
        return res.json({company});

    } catch(err) {
        return next(err);
    }
})

router.delete("/:handle", ensureAdmin, async function(req, res, next){
    try {
        const company = await Company.delete(req.params.handle);
        return res.json({message: "Company deleted"});

    } catch(err) {
        return next(err);
    }
})

module.exports = router;