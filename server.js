// importa o módulo nativo 'http' do node.js
const http = require('http');
const mysql = require('mysql2');

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
        console.error('erro ao conectar ao mysql: ', err.stack);
        return;
    }
    console.log('conectado ao mysql com sucesso!');
});


// define o endereço (localhost) e a porta onde o servidor vai escutar
const hostname = '127.0.0.1';
const port = 3000;

// cria o servidor web
const server = http.createServer((req, res) => {

    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        return res.end('<h1>página inicial</h1>'); // o return impede a execução das linhas de baixo
    }

    if (req.url === '/alunos') {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        return res.end('<h1>lista de alunos</h1>'); // o return impede a execução das linhas de baixo
    }

    // se nenhuma rota acima for satisfeita, cai no 404
    res.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'});

    // envia a resposta para o navegador/cliente
    res.end('<h1 style="color: red;">404 - not found in the system</h1>');


});

// faz o servidor começar a escutar na porta definida
server.listen(port, hostname, () => {
    console.log(`Servidor rodando em http://${hostname}:${port}/`);
});