const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const User = require("../models/user");
const jsonschema = require("jsonschema");
const userSchema = require("../schemas/updateUser.json")
const createToken = require("../helpers/createToken");
const {ensureCorrectUser} = require("../middleware/middlewareAuth");

router.get("/", async function(req, res, next){
    try {
        const users = await User.getAll(req.body);
        return res.json({users});

    } catch(err) {
        return next(err);
    }
})

router.post("/", async function(req, res, next){
    try {
        const validation = jsonschema.validate(req.body, userSchema);
        if (!validation.valid) {
          throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }
        
        const user = await User.register(req.body);
        const token = createToken(user);
        
        return res.status(201).json({ token });

    } catch(err) {
        return next(err);
    }
})
router.get("/:username", async function(req, res, next){
    try {
        const user = await User.getOne(req.params.username);
        return res.json({user})

    } catch(err) {
        return next(err);
    }
})
router.patch("/:username", ensureCorrectUser, async function(req, res, next){
    try {
        if ('username' in req.body || 'is_admin' in req.body) {
            throw new ExpressError(
              'You are not allowed to change username or is_admin properties.',
              400);
        }
    
        const validation = validate(req.body, userUpdateSchema);
        if (!validation.valid) {
          throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }
    
        const user = await User.update(req.params.username, req.body);
        return res.json({ user });
      } catch (err) {
        return next(err);
      }
})

router.delete("/:username", ensureCorrectUser, async function(req, res, next){
    try {
        await User.delete (req.params.username);
        return res.json({message: "deleted user"})

    } catch(err) {
        return next(err);
    }
})

module.exports = router;