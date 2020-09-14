const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const Job = require("../models/job");
const jsonschema = require("jsonschema");
const updateJob = require("../schemas/updateJob.json");
const { authRequired } = require("../middleware/middlewareAuth");
const {ensureAdmin} = require("../middleware/middlewareAuth");

router.get("/", authRequired, async function(req, res, next){
    try {
        const jobs = await Job.searchAll(req.body);
        return res.json({jobs})

    } catch(err) {
        return next(err);
    }
})

router.post("/", ensureAdmin, async function(req, res, next){
    try {
        const validation = jsonschema.validate(req.body, updateJob);

        if (!validation.valid) {
          throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }
        const job = await Job.create(req.body);
        return res.json({job})

    } catch(err) {
        return next(err);
    }
})

router.get("/:id", authRequired, async function(req, res, next){
    try {
        const jobs = await Job.getOne(req.params.id);
        return res.json({jobs})

    } catch(err) {
        return next(err);
    }
})

router.patch("/:id", ensureAdmin, async function(req, res, next){
    try {
        if (`id` in req.body) {
            throw new ExpressError(`Cannot change id`, 400)
        }
        const validation = jsonschema.validate(req.body, updateJob);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
          }
        const job = await Job.update(req.params.id, req.body);
        return res.json({job});

    } catch(err) {
        return next(err);
    }
})

router.delete("/:id", ensureAdmin, async function(req, res, next){
    try {
        await Job.delete(req.params.id);
        return res.json({message: "job removed"})

    } catch(err) {
        return next(err);
    }
})

module.exports = router;