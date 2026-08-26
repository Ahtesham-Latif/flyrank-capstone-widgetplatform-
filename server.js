import express from 'express';
import db from './src/config/db.js'

const app= express();

const PORT=3000;

app.use(express.json());
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

app.listen(PORT,()=>{
    console.log(`Widget Platfrom listening on http://localhost:${PORT}`);
});