const userModel = require('../models/user.model');
const cookie = require('cookie');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


//Register user
async function registerUser(req,res) {
    const {fullName:{firstName,lastName}, email, password} = req.body;
    
    const isUserAlreadyExists = await userModel.findOne({email});

    if(isUserAlreadyExists){
        return res.status(400).json({message: "User already exists"});
    }

    const hashPassword = await bcrypt.hash(password,10);

    const user = await userModel.create({
        fullName:{
            firstName, lastName
        },
        email,
        password: hashPassword
    })

    const token =  jwt.sign({id: user._id}, process.env.JWT_SECRET);

    res.cookie("token",token);

    res.status(201).json({
        message: "User registered successfully",
        user: {
            email: user.email,
            _id: user._id,
            fullName: user.fullName
        }
    });


}

// Login User
async function loginUser(req,res) {
    const {email,password} = req.body;

    const user = await userModel.findOne({email});

    if(!user){
        return res.status(400).json({message: "Invalid email or password"});
    }

    const isPasswordValid = await bcrypt.compare(password,user.password);

    if(!isPasswordValid){
        return res.status(400).json({message: "Invalid email or password"});
    }

    const token = jwt.sign({id: user._id},process.env.JWT_SECRET);

    res.cookie('token', token, {
  httpOnly: true,
  secure: true,      // because Render + Vercel = HTTPS
  sameSite: 'none',  // required for cross-origin
});

    // res.cookie("token",token);

    res.status(200).json({
        message: "User loggedIn Successfully",
        user: {
            email: user.email,
            _id: user._id,
            fullName: user.fullName
        }
    })

}

// User Check Function
async function UserCheck(req,res){
    const bodyData = req.headers.cookie;
    const cookieObj = cookie.parse(bodyData);
    // console.log(cookieObj.token);

    try{
            const decoded = jwt.verify(cookieObj.token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);

            if(!user){
                return res.status(404).json({
                    message: "Invalid User"
                })
            }

            return res.status(200).json({
                message: "Valid User",
                user
            })
            
        }
        catch(err){
            return res.send(err);
        }

}


module.exports = {registerUser, loginUser, UserCheck}