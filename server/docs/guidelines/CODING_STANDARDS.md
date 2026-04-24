# Coding Standards & Best Practices

## 📋 Table of Contents

1. [General Guidelines](#general-guidelines)
2. [File & Folder Organization](#file--folder-organization)
3. [Naming Conventions](#naming-conventions)
4. [Code Formatting](#code-formatting)
5. [JavaScript Best Practices](#javascript-best-practices)
6. [Error Handling](#error-handling)
7. [Security Guidelines](#security-guidelines)
8. [Git Workflow](#git-workflow)
9. [Code Review Checklist](#code-review-checklist)

---

## 📐 General Guidelines

### Code Quality Principles

1. **KISS** - Keep It Simple, Stupid
2. **DRY** - Don't Repeat Yourself
3. **SOLID** - Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
4. **YAGNI** - You Aren't Gonna Need It

### Team Rules

- Write clean, readable, and maintainable code
- Comment complex logic (but write self-documenting code first)
- Keep functions small and focused (max 50 lines)
- One responsibility per file
- Review your own code before committing
- Help teammates when stuck

---

## 📁 File & Folder Organization

### Project Structure

```
eventify/
├── models/              # Database models (Mongoose schemas)
├── controllers/         # Request handlers (business logic)
├── routes/              # API route definitions
├── middlewares/         # Custom middleware
├── config/              # Configuration files
├── utils/               # Utility/helper functions
├── public/              # Static files
├── views/               # Templates (optional)
├── tests/               # Test files
├── docs/                # Documentation
├── .env                 # Environment variables (NOT committed)
├── .gitignore
├── app.js               # Express app setup
├── server.js            # Server entry point
└── package.json
```

### File Naming

- Use **camelCase** for JavaScript files: `authController.js`, `eventRoutes.js`
- Use **PascalCase** for model files: `User.js`, `Event.js`, `Booking.js`
- Use **lowercase** with hyphens for documentation: `setup-guide.md`

### File Size Limits

- **Controllers**: Max 200 lines (split if larger)
- **Routes**: Max 100 lines
- **Models**: Max 150 lines
- **Middleware**: Max 50 lines each
- **Functions**: Max 50 lines

---

## 🏷️ Naming Conventions

### Variables and Functions

```javascript
// ✅ GOOD - camelCase for variables and functions
const userName = 'John';
const isLoggedIn = true;
const getUserById = async (id) => { ... };
const calculateTotalPrice = (price, quantity) => { ... };

// ❌ BAD - Inconsistent naming
const user_name = 'John';           // snake_case
const IsLoggedIn = true;            // PascalCase
function get_user(id) { ... }       // snake_case
```

### Constants

```javascript
// ✅ GOOD - UPPER_SNAKE_CASE for constants
const MAX_RETRY_ATTEMPTS = 3;
const JWT_EXPIRY_TIME = '7d';
const DEFAULT_PAGE_SIZE = 10;

// ❌ BAD
const maxRetryAttempts = 3;
const jwtExpiryTime = '7d';
```

### Classes and Models

```javascript
// ✅ GOOD - PascalCase for classes and models
class AppError extends Error { ... }
const User = mongoose.model('User', userSchema);
const EventController = { ... };

// ❌ BAD
const appError = new AppError();
const user = mongoose.model('User', userSchema);
```

### Database Fields

```javascript
// ✅ GOOD - camelCase in Mongoose schemas
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  createdAt: Date
});

// MongoDB stores as: firstName, lastName, email, createdAt
```

---

## 📝 Code Formatting

### Indentation

- Use **2 spaces** for indentation (NOT tabs)
- Configure your editor to convert tabs to spaces

```javascript
// ✅ GOOD
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Semicolons

- **Always use semicolons** at the end of statements

```javascript
// ✅ GOOD
const name = 'John';
const user = await User.findById(id);
res.json({ success: true });

// ❌ BAD - Missing semicolons
const name = 'John'
const user = await User.findById(id)
res.json({ success: true })
```

### Quotes

- Use **single quotes** for strings

```javascript
// ✅ GOOD
const message = 'User created successfully';
const query = 'SELECT * FROM users';

// ❌ BAD
const message = "User created successfully";
```

- Exception: Use double quotes when string contains single quote

```javascript
// ✅ GOOD
const greeting = "Welcome to John's Event Booking System";
```

### Spacing

```javascript
// ✅ GOOD - Proper spacing
const add = (a, b) => {
  return a + b;
};

if (condition) {
  // code
}

for (let i = 0; i < 10; i++) {
  // code
}

// ❌ BAD - Inconsistent spacing
const add=(a,b)=>{
return a+b;
}

if(condition){
//code
}
```

### Line Length

- Maximum **100 characters** per line
- Break long lines for readability

```javascript
// ✅ GOOD
const result = await User.find({
  email: { $regex: searchQuery, $options: 'i' },
  role: { $in: ['admin', 'user'] }
});

// ❌ BAD - Too long
const result = await User.find({ email: { $regex: searchQuery, $options: 'i' }, role: { $in: ['admin', 'user'] } });
```

---

## 💻 JavaScript Best Practices

### Use Modern JavaScript (ES6+)

```javascript
// ✅ GOOD - const/let
const MAX_SIZE = 100;
let currentUser = null;

// ❌ BAD - var
var MAX_SIZE = 100;
var currentUser = null;
```

### Arrow Functions

```javascript
// ✅ GOOD - Arrow functions for callbacks
const users = await User.find().sort({ createdAt: -1 });
const userNames = users.map(user => user.name);

// ✅ GOOD - Regular functions for named exports
exports.createUser = async (req, res) => {
  // code
};

// ❌ BAD - Function expressions
const createUser = function(req, res) {
  // code
};
```

### Async/Await (NOT .then())

```javascript
// ✅ GOOD - Async/await
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ❌ BAD - Promise chains
const getUser = (req, res) => {
  User.findById(req.params.id)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ user });
    })
    .catch(error => {
      res.status(500).json({ error: error.message });
    });
};
```

### Destructuring

```javascript
// ✅ GOOD - Destructuring
const { name, email, password } = req.body;
const { id, role } = req.user;

// ❌ BAD - Accessing properties individually
const name = req.body.name;
const email = req.body.email;
const password = req.body.password;
```

### Template Literals

```javascript
// ✅ GOOD - Template literals
const message = `User ${name} created successfully`;
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ❌ BAD - String concatenation
const message = 'User ' + name + ' created successfully';
```

### Default Parameters

```javascript
// ✅ GOOD - Default parameters
const getEvents = async (page = 1, limit = 10) => {
  // code
};

// ❌ BAD - Checking for undefined
const getEvents = async (page, limit) => {
  const actualPage = page || 1;
  const actualLimit = limit || 10;
};
```

---

## ⚠️ Error Handling

### Use Try-Catch Blocks

```javascript
// ✅ GOOD - Proper error handling
exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### Consistent Error Responses

```javascript
// ✅ GOOD - Standard error format
{
  "success": false,
  "message": "Descriptive error message",
  "errors": []  // Optional: array of specific errors
}

// ❌ BAD - Inconsistent formats
{ "error": "Something went wrong" }
{ "message": "Error occurred", "status": "error" }
```

### Don't Expose Sensitive Data

```javascript
// ✅ GOOD - Production-safe error
res.status(500).json({
  success: false,
  message: 'Internal server error'
});

// ❌ BAD - Exposes stack trace
res.status(500).json({
  success: false,
  message: error.message,
  stack: error.stack,
  details: error
});
```

### Handle All Promise Rejections

```javascript
// ✅ GOOD - Catch all errors
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
```

---

## 🔒 Security Guidelines

### NEVER Do These:

❌ **Never commit `.env` file**
```bash
# Add to .gitignore
.env
```

❌ **Never hardcode secrets**
```javascript
// ❌ BAD
const dbUrl = 'mongodb://user:password@localhost:27017';
const jwtSecret = 'my_secret_key_123';

// ✅ GOOD
const dbUrl = process.env.DB_URL;
const jwtSecret = process.env.JWT_SECRET;
```

❌ **Never trust user input**
```javascript
// ❌ BAD - No validation
const email = req.body.email;
await User.findOne({ email });

// ✅ GOOD - Validate and sanitize
const { email } = req.body;
if (!isValidEmail(email)) {
  return res.status(400).json({ message: 'Invalid email' });
}
await User.findOne({ email: sanitizeEmail(email) });
```

❌ **Never expose passwords**
```javascript
// ❌ BAD
res.json({ user });  // Includes password

// ✅ GOOD
const userObj = user.toObject();
delete userObj.password;
res.json({ user: userObj });

// Or in Mongoose schema:
password: { type: String, select: false }
```

❌ **Never use eval()**
```javascript
// ❌ BAD - Security risk
eval(userInput);

// ✅ GOOD - Safe alternatives
JSON.parse(userInput);
```

### Always Do These:

✅ **Hash passwords**
```javascript
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
```

✅ **Use HTTPS in production**

✅ **Validate all inputs**
```javascript
const { body, validationResult } = require('express-validator');

exports.register = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Continue...
  }
];
```

✅ **Use rate limiting**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);
```

✅ **Set security headers**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## 🔄 Git Workflow

### Commit Messages

Use descriptive commit messages:

```bash
# Format: type(scope): description

# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting (no code change)
refactor: Code restructuring
test:     Tests
chore:    Maintenance tasks

# Examples:
git commit -m "feat(auth): add JWT token generation"
git commit -m "fix(events): handle missing event ID"
git commit -m "docs(api): update swagger documentation"
git commit -m "test(auth): add login test cases"
```

### Branch Naming

```bash
# Feature branches
git checkout -b feature/user-authentication
git checkout -b feature/event-crud

# Bug fix branches
git checkout -b fix/login-validation
git checkout -b fix/event-date-error

# Documentation branches
git checkout -b docs/api-documentation
```

### Commit Frequently

```bash
# Small, focused commits
git add models/User.js controllers/authController.js
git commit -m "feat(auth): implement user registration and login"

# NOT one massive commit
git add .
git commit -m "done with everything"  # ❌ BAD
```

### Pull Before Push

```bash
# Always pull latest changes first
git pull origin main
git push origin main

# Resolve conflicts locally before pushing
```

### .gitignore Must Include

```
node_modules/
.env
*.log
.DS_Store
.vscode/
.idea/
```

---

## ✅ Code Review Checklist

Before submitting your code, verify:

### Functionality
- [ ] Code works as expected
- [ ] All edge cases handled
- [ ] Error cases return correct status codes
- [ ] No console.log() left in code (use logger instead)

### Code Quality
- [ ] Follows naming conventions
- [ ] Proper indentation (2 spaces)
- [ ] Functions are small and focused
- [ ] No duplicate code (DRY principle)
- [ ] Comments for complex logic

### Security
- [ ] No hardcoded secrets
- [ ] Passwords hashed
- [ ] Input validated and sanitized
- [ ] No sensitive data in responses
- [ ] Rate limiting applied

### Testing
- [ ] Tested with Postman/Insomnia
- [ ] Success cases work
- [ ] Error cases handled
- [ ] Authentication works
- [ ] Authorization works (roles)

### Documentation
- [ ] Routes documented (if applicable)
- [ ] README updated
- [ ] Swagger comments added (if applicable)

### Git
- [ ] Commit message is descriptive
- [ ] Only necessary files committed
- [ ] `.env` NOT committed
- [ ] Branch name follows convention
- [ ] Pulled latest changes before push

---

## 📚 Recommended VS Code Extensions

Install these extensions for better development:

1. **ESLint** - JavaScript linting
2. **Prettier** - Code formatting
3. **MongoDB for VS Code** - Database management
4. **Thunder Client** - API testing (alternative to Postman)
5. **GitLens** - Git integration
6. **DotENV** - .env file syntax highlighting
7. **Error Lens** - Inline error highlights
8. **Bracket Pair Colorizer** - Matching brackets

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.detectIndentation": false,
  "files.autoSave": "afterDelay",
  "javascript.preferences.quoteStyle": "single",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

---

## 🎯 Quick Reference

### DO ✅

- Use `const` and `let` (not `var`)
- Use async/await (not .then())
- Use single quotes
- Use 2-space indentation
- Use semicolons
- Use template literals
- Use destructuring
- Use arrow functions for callbacks
- Write small, focused functions
- Handle errors properly
- Validate all inputs
- Comment complex logic

### DON'T ❌

- Don't commit `.env`
- Don't hardcode secrets
- Don't use `eval()`
- Don't expose passwords
- Don't use `var`
- Don't use string concatenation (use template literals)
- Don't leave `console.log()` in code
- Don't write functions > 50 lines
- Don't duplicate code
- Don't skip error handling
- Don't trust user input
- Don't push without pulling first

---

## 📞 Questions?

If unsure about coding standards:
1. Check this document first
2. Look at existing code for examples
3. Ask the team lead
4. Discuss in team meeting

---

**Remember:** Write code as if the person maintaining it is a violent psychopath who knows where you live. 💻😄

---

*Last Updated: April 2026*
