const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp =  require('hpp');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const app = express();

const PORT = process.env.PORT || 5000;

//Router
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const authRoute = require('./routes/auth');
const userRoute = require('./routes/users');
const reviews = require('./routes/reviews');

//Load env var
dotenv.config({path:'./config/config.env'});

//Connect database
connectDB();

// Use middleware to log specifics of each request
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))

}

//Body Parser
app.use(express.json());

//prevent Cross Site Scripting(xss)
app.use(xss());

//Cookie Parser
app.use(cookieParser());

// Sanitize payload
app.use(mongoSanitize());

//Set security headers
app.use(helmet());

//Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100
});

app.use(limiter)

//prevent http param pollution
app.use(hpp());

//Enable Cross-origin resource sharing (CORS)
app.use(cors());



//File uploading
app.use(fileupload());


//Set static folder
app.use(express.static(path.join(__dirname, 'public')));


//Mount Router
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/reviews', reviews);


app.use(errorHandler);

const server = app.listen(
    PORT,
    console.log(`Server listening in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

//Handle unhandled promise rejections 
process.on('unhandledRejection', (err, promise) =>{
    console.log(`Error: ${err.message}`.red);
    //Close server and exit process
    server.close(()=> process.exit(1));
})