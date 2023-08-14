const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const path = require('path');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const app = express();

const PORT = process.env.PORT || 5000;

//Router
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const authRoute = require('./routes/auth');
const userRoute = require('./routes/users')

//Load env var
dotenv.config({path:'./config/config.env'});

//Connect database
connectDB();

// Use middleware to log specifics of each request
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))

}


//File uploading
app.use(fileupload());


//Set static folder
app.use(express.static(path.join(__dirname, 'public')));


//Body Parser
app.use(express.json());

//Cookie Parser
app.use(cookieParser());


//Mount Router
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/users', userRoute);


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