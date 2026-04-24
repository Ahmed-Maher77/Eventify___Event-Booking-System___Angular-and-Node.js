import { body, param, query, validationResult } from 'express-validator';
import AppError from '../middlewares/AppError.js';

/**
 * Validator utilities
 * Helper functions for input validation and sanitization
 */

/**
 * Handle validation errors
 * Must be called after validation chains
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    throw AppError.badRequest(errorMessages.join(', '));
  }
  next();
};

/**
 * Validate user registration
 */
const validateRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  
  handleValidationErrors
];

/**
 * Validate user login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Validate event creation/update
 */
const eventCategories = ['concert', 'conference', 'workshop', 'seminar', 'sports', 'other'];

const ensureEventBody = (req, res, next) => {
  const { body: requestBody } = req;

  if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody) || Object.keys(requestBody).length === 0) {
    throw AppError.badRequest('Request body is required');
  }

  next();
};

const validateCreateEvent = [
  ensureEventBody,
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .bail()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .bail()
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  
  body('date')
    .notEmpty().withMessage('Date is required')
    .bail()
    .isISO8601().withMessage('Please provide a valid date')
    .bail()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),
  
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .bail()
    .isLength({ min: 3, max: 200 }).withMessage('Location must be between 3 and 200 characters'),
  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .bail()
    .isIn(eventCategories)
    .withMessage('Category must be one of: concert, conference, workshop, seminar, sports, other'),
  
  body('capacity')
    .notEmpty().withMessage('Capacity is required')
    .bail()
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .bail()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  
  handleValidationErrors
];

  const validateUpdateEvent = [
    (req, res, next) => {
      const updatableFields = ['title', 'description', 'date', 'location', 'category', 'capacity', 'price', 'imageUrl'];
      const hasAtLeastOneField = updatableFields.some((field) =>
        Object.prototype.hasOwnProperty.call(req.body, field),
      );

      if (!hasAtLeastOneField && !req.file) {
        throw AppError.badRequest('At least one field (title, description, date, location, category, capacity, price, imageUrl) or an image file must be provided for update');
      }

      next();
    },
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),

    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),

    body('date')
      .optional()
      .isISO8601().withMessage('Please provide a valid date')
      .bail()
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Event date must be in the future');
        }
        return true;
      }),

    body('location')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 }).withMessage('Location must be between 3 and 200 characters'),

    body('category')
      .optional()
      .trim()
      .isIn(eventCategories)
      .withMessage('Category must be one of: concert, conference, workshop, seminar, sports, other'),

    body('capacity')
      .optional()
      .isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),

    body('price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

    body('imageUrl')
      .optional()
      .trim()
      .isURL().withMessage('imageUrl must be a valid URL'),

    handleValidationErrors
  ];
/**
 * Validate booking creation
 */
const validateBooking = [
  body('eventId')
    .notEmpty().withMessage('Event ID is required')
    .isMongoId().withMessage('Please provide a valid event ID'),
  
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Validate MongoDB ObjectId parameter
 */
const validateObjectId = (paramName = 'id') => {
  return [
    param(paramName)
      .isMongoId().withMessage(`Please provide a valid ID`),
    handleValidationErrors
  ];
};

/**
 * Validate pagination and query parameters
 */
const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .trim(),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Order must be either asc or desc'),
  
  handleValidationErrors
];

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export {
  validateRegistration,
  validateLogin,
  validateCreateEvent,
  validateUpdateEvent,
  validateBooking,
  validateObjectId,
  validateQuery,
  handleValidationErrors,
  sanitizeString,
  isValidEmail
};
