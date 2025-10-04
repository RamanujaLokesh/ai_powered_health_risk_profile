// server.js
import express, { json } from 'express';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env from root
dotenv.config({ path: path.resolve(__dirname, "./.env") });


import profileRouter from './router/profile.routes.js';

const app = express();
const PORT = process.env.PORT||3000; ;


app.use(json());
app.use('/',profileRouter);
app.use('*',(req,res)=>{
    res.status(404).json({error:'unknown url'});
})

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Health profiler server is running at http://localhost:${PORT}`);
    console.log('To test, send a POST request with a file upload to http://localhost:3000/api/analyze');
});

    
