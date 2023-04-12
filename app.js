require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const PORT = 3000;

const User = require('./models/User.js');

app.get('/', (req, res) => {
    res.status(200).json({msg: "Hello, World!"});
});

// Valores retirados do .env
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

// Conexão inicial com MongoDB e app.listen
mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@main-cluster.hnbtuf0.mongodb.net/?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(PORT)
        console.log("Conexão realizada com sucesso!")
}).catch((err) => console.error(err))

app.post('/auth/register', async (req, res) => {
    const {name, email, password, confirmPassword} = req.body;

    // Validação de campos
    if(!name) {
        return res.status(422).json({msg: "O nome é obrigatório"});
    } if(!email) {
        return res.status(422).json({msg: "O email é obrigatório"});
    } if(!password) {
        return res.status(422).json({msg: "A senha é obrigatória"});
    } if(password != confirmPassword) {
        return res.status(422).json({msg: "As senhas não conferem"});
    }

    // Verifica se usuário já existe
    const userExist = await User.findOne({email: email})
    if (userExist) {
        return res.status(422).json({msg: `Usuário com email ${email} já existe`});
    }

    // Criptografando senha com bcrypt
    const salt = await bcrypt.genSalt(12);
    const passHash = await bcrypt.hash(password, salt);

    // Criando usuário usando model User
    const user = new User({
        name, email, password: passHash
    });

    try {
        await user.save();
        return res.status(201).json({msg: "Usuário criado com sucesso"});
    } catch (err) {
        console.error(err);
    }

    res.end();
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Validação de campos
    if(!email) {
        return res.status(422).json({msg: "O email é obrigatório"});
    } if(!password) {
        return res.status(422).json({msg: "A senha é obrigatória"});
    }

    // Verifica se usuário existe
    const user = await User.findOne({email: email})
    if (!user) {
        return res.status(404).json({msg: "Usuário não existe"});
    }

    const checkPass = await bcrypt.compare(password, user.password);
    if(!checkPass) {
        return res.status(422).json({msg: "Senha incorreta"});
    }

    return res.status(200).json({msg: "Login realizado com sucesso"});
});