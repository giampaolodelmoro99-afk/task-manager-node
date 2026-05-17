const {body, validationResult} = require('express-validator');

const validate = (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ message: 'Dati non validi', errors: errors.array() });
    } 

    next();
};

const registerValidator = [
    body('name').isString().trim().isLength({ min: 2, max: 40 }),
    body('surname').isString().trim().isLength({ min: 2, max: 40 }),
    body('email').isEmail().normalizeEmail().isLength({ max: 90 }),
    body('password').isLength({ min: 6 }),
    validate
];

const loginValidator = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
];

const taskValidator = [
    body('title_task').isString().trim().isLength({ min: 2, max:40 }),
    body('date').isISO8601(),
    body('time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
    validate
];

const noteValidator = [
    body('title_note').isString().trim().isLength({ min: 2, max:40 }),
    body('is_completed').optional().isBoolean(),
    validate
];

module.exports = {
    registerValidator,
    loginValidator,
    taskValidator,
    noteValidator
}