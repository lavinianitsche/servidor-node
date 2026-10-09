const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sleepstreet'
});

connection.connect((err) => {
    if (err) {
        console.error('erro ao conectar ao mysql: ', err.stack);
        return;
    }
    console.log('conectado ao mysql com sucesso!');
});

function verificarMaiorIdade(dataNascimento) {
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mes = hoje.getMonth() - nasc.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
    }
    return idade >= 18 ? 1 : 0;
}

app.post('/cadastro', async (req, res) => {
    const { nome, email, senha, dataNascimento, emailResponsavel, consentimentoGeo } = req.body;

    if (!nome || !email || !senha || !dataNascimento) {
        return res.status(400).json({ erro: 'preencha todos os campos obrigatórios' });
    }

    try {
        const maiorIdade = verificarMaiorIdade(dataNascimento);
        let idResponsavelLegal = null;

        if (maiorIdade === 0) {
            if (!emailResponsavel) {
                return res.status(400).json({ erro: 'menores de idade necessitam obrigatoriamente do e-mail do responsável legal' });
            }

            const queryBusca = 'select id_usuario from usuario where email = ?';
            connection.query(queryBusca, [emailResponsavel], async (errBusca, resultadosBusca) => {
                if (errBusca) {
                    return res.status(500).json({ erro: 'erro interno ao validar responsável' });
                }
                if (resultadosBusca.length === 0) {
                    return res.status(400).json({ erro: 'e-mail do responsável legal não encontrado no sistema' });
                }

                idResponsavelLegal = resultadosBusca[0].id_usuario;
                await realizarInsercao(idResponsavelLegal);
            });
        } else {
            await realizarInsercao(null);
        }

        async function realizarInsercao(responsavelId) {
            const senhaHasheada = await bcrypt.hash(senha, 12);
            const query = 'insert into usuario (nome, email, senha_hash, data_nascimento, maior_idade, id_responsavel_legal, consentimento_lgpd_geo) values (?, ?, ?, ?, ?, ?, ?)';
            
            connection.query(
                query, 
                [nome, email, senhaHasheada, dataNascimento, maiorIdade, responsavelId, consentimentoGeo], 
                (err, result) => {
                    if (err) {
                        console.error("erro do mysql no cadastro:", err);
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(409).json({ erro: 'email já cadastrado' });
                        }
                        return res.status(500).json({ erro: 'erro ao cadastrar no banco' });
                    }
                    res.status(201).json({ id: result.insertId, nome, email, mensagem: "usuário cadastrado com sucesso!" });
                }
            );
        }

    } catch (erro) {
        console.error("erro interno no servidor:", erro);
        return res.status(500).json({ erro: 'erro interno no servidor' });
    }
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'preencha todos os campos' });
    }

    const query = 'select id_usuario, nome, email, senha_hash from usuario where email = ?';
    
    connection.query(query, [email], async (err, results) => {
        if (err) {
            console.error("erro do mysql no login:", err);
            return res.status(500).json({ erro: 'erro ao fazer login' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ erro: 'email ou senha inválidos' });
        }

        const usuarioEncontrado = results[0];

        try {
            const senhaCorreta = await bcrypt.compare(senha, usuarioEncontrado.senha_hash);

            if (!senhaCorreta) {
                return res.status(401).json({ erro: 'email ou senha inválidos' });
            }

            res.json({ 
                mensagem: 'login ok', 
                usuario: {
                    id: usuarioEncontrado.id_usuario,
                    nome: usuarioEncontrado.nome,
                    email: usuarioEncontrado.email
                }
            });

        } catch (erro) {
            console.error("erro no comparar senhas:", erro);
            return res.status(500).json({ erro: 'erro interno ao validar senha' });
        }
    });
});

app.listen(port, () => {
    console.log(`servidor rodando em http://localhost:${port}/`);
});
