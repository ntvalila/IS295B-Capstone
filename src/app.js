import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import pgSession from 'connect-pg-simple'
import helmet from 'helmet'
import morgan from 'morgan'
import flash from 'connect-flash' // Added for success/error messages
import pool from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import nocache from 'nocache'
import passport from 'passport'


// --- SWAGGER IMPORTS ---
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const app = express()
const PgSession = pgSession(session)

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Web Archive API',
      version: '1.0.0',
      description: 'API documentation for the Web Archiving project',
    },
    servers: [{ url: 'http://localhost:8086' }],
  },
  apis: ['./app.js', './src/routes/*.js'], 
}
const specs = swaggerJsdoc(swaggerOptions)

// --- VIEW ENGINE SETUP ---
app.set('view engine', 'ejs')
app.set('views', './src/views')

// --- MIDDLEWARE ---

// 1. Security (Updated CSP for Swagger)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        "img-src": ["'self'", "data:", "https://validator.swagger.io"],
      },
    },
  })
)

//Disable page return
app.use(nocache())

// 2. Logging & Parsing
app.use(morgan('dev'))
app.use(express.json()) // Support JSON bodies
app.use(express.urlencoded({ extended: true })) // Support Form bodies
app.use(express.static('public'))

// 3. Session Management
app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
  })
)

// 4. Flash Messages
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// 5. Global Variables (Available in all EJS templates)
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.session.user || null; // Access user info in headers/partials
  res.locals.path = req.path; // Keep track of active navigation links
  next();
});


// --- ROUTES ---

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// Auth Routes
app.use(authRoutes)

// (Optional) Placeholder for Admin/Collection routes if they are in a separate file
// import collectionRoutes from './routes/collection.routes.js'
// app.use('/admin', collectionRoutes)

// --- ERROR HANDLING ---
app.use((req, res) => {
  // Try rendering a simple string first to see if the error goes away
  res.status(404).send("404 - Page Not Found");
});

export default app