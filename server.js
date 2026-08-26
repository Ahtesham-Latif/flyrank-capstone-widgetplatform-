import express from 'express';
import db from './src/config/db.js'
import authRoutes from './src/routes/auth.routes.js';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const app= express();

const PORT= process.env.PORT || 3000;

app.use(express.json());
// Session Middleware with secure cookie settings and maxAge of 1 day
app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'super_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);


// console.log("Hye from server before health endpoint");
app.get('/health', async(req,res)=>{
    try{
        await db.raw('SELECT 1');
        res.status(200).json({
            status:'OK',
            databse:'Connected'
        });
    }
    catch (err) {
        res.status(500).json({
            status:'error',
            message:err.message
        })
    }
});


app.use('/api/auth', authRoutes);

app.listen(PORT,()=>{
    console.log(`Widget Platfrom listening on http://localhost:${PORT}`);
});