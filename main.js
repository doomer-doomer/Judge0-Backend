const express = require('express')
const mongoose = require('mongoose');
const Submit = require('./Models/submissons');
require('dotenv').config()
const bcrypt = require('bcrypt');
const signUp = require('./Models/signUp');
const authToken = require('./jwtToken/jwtTokenGenerator');
const verification = require('./jwtToken/verification');
const cluster = require("cluster");
const totalCPUs = require("os").cpus().length;

if (cluster.isMaster) {
    console.log(`Number of CPUs is ${totalCPUs}`);
    console.log(`Master ${process.pid} is running`);
   
    for (let i = 0; i < totalCPUs; i++) {
      cluster.fork();
    }
   
    cluster.on("exit", (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
      console.log("Let's fork another worker!");
      cluster.fork();
    });
  } else {

        const app = express();

        app.use(express.json())
      
        app.post('/signup',async(req,res)=>{
            try {
                const {userName,email,password} = req.body;

                const salt = await bcrypt.genSalt(10);
                const bcryptpassword = await bcrypt.hash(password,salt);

                const findEmail = await signUp.find({
                    "email":email
                })
                if(findEmail.length!==0){
                    return res.status(400).json("Account already found!");
                }
                const insert = await signUp.create({
                    "username":userName,
                    "email":email,
                    "password":bcryptpassword
                })

                const getauthToken = authToken(insert.user_id);
                return res.status(200).json({getauthToken})
            } catch (error) {
                console.error(error.message);
                return res.status(500).json("Some Error in Query");
            }
            
        })

        app.post('/login',async(req,res)=>{
            try {
                const {email,password} = req.body;
                
                const findEmail = await signUp.find({
                    "email":email
                })
                if(findEmail.length===0  ){
                    return res.status(400).json("Account not found!");
                }

                const validPassword = await bcrypt.compare(
                    password,
                    findEmail[0].password
                );

                if(!validPassword){
                    return res.status(400).json("Invalid Password");
                }

                const getauthToken = authToken(findEmail[0].user_id);
                return res.status(200).json({getauthToken})
            } catch (error) {
                console.error(error.message);
                return res.status(500).json("Some Error in Query");
            }
        })


        app.post("/submission",verification,async(req,res)=>{
            try {
                const {id,code} = req.body;

                const base64 = Buffer.from(code).toString('base64');
    
                try {
                    const sendCode = await fetch("https://judge0-extra-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true&fields=*",
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RapidAPI-Key': process.env.RapidAPIKey,
                        'X-RapidAPI-Host': process.env.RapidAPIHost
                    },
                    body:JSON.stringify({
                        "language_id": id,
                        "source_code": base64
                    })
                })
        
                const response = await sendCode.json()
                const Token = await response.token;
                console.log(response);
                console.log(Token)

                if(Token===""){
                    return res.json("No Result")
                }

                    try {
                        const getCode = await fetch(`https://judge0-extra-ce.p.rapidapi.com/submissions/${Token}?base64_encoded=true&fields=*`,
                        {
                            method: 'GET',
                            headers: {
                                'X-RapidAPI-Key': process.env.RapidAPIKey,
                                'X-RapidAPI-Host': process.env.RapidAPIHost
                            }
                        })


                        const resultresponse = await getCode.json()

                        const encodedOutput = resultresponse.stdout
                        const decodedOutput = Buffer.from(encodedOutput, 'base64').toString('utf-8');

                        const submit = await Submit.create({
                            "user_id":req.user,
                            "language_id":id,
                            "source_code":code,
                            "results":decodedOutput
                        })

                        return res.status(200).json(submit)
                    } catch (error) {
                        return res.status(400).json({message:error.message})
                    }
                } catch (error) {
                    return res.status(400).json({message:error.message})
                }
                
                
            } catch (error) {
                console.log(error.message)
                return res.status(500).json({message:error.message})
            }
        })

        app.get("/mySubmissions",verification,async(req,res)=>{
            try {
                const getAllSubmissions = await Submit.find({
                    "user_id":req.user
                })
                return res.status(200).json(getAllSubmissions)
            } catch (error) {
                console.log(error.message)
                return res.status(500).json({message:error.message})
            }
        })

        mongoose.connect(`mongodb+srv://${process.env.name}:${process.env.password}@judge0.lfprgru.mongodb.net/?retryWrites=true&w=majority`)
        .then(() => {
            console.log('Connected to MongoDB Successfully!')
            app.listen(process.env.CommonPORT,()=>{
                console.log("Server started successfully")
            })
        }).catch((err)=>{
            console.log(err)
        });

       
    }