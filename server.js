const express = require('express');
const mysql = require('mysql2');

const cors = require('cors');

const app = express();
const port = 3000;

// usar o cors
app.use(cors())

// middleware para o express entender json no corpo da requisição (req.body)
app.use(express.json());

// 1. configura a conexão com o mysql
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kiwi'
});

// conecta ao banco de dados
connection.connect((err) => {
    if (err) {
        console.error('erro ao conectar ao mysql: ', err.stack );
        return;
    }
    console.log('conectado ao mysql com sucesso!');

    // cria a tabela 'alunos'  caso ela não exista
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS alunos(
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL
        )`;
        connection.query( createTableQuery, (err) => {
            if (err) {
                console.error('erro ao criar tabela: ', err.stack );
                return;
            }
        });
});

app.get('/alunos', (req, res) => {
    connection.query('SELECT * FROM alunos', (err, results) => {
        if (err) {
            return res.status(500).json({erro: 'erro ao buscar alunos'});
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`servidor rodando em http://localhost:${port}/`);
});