const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function testLogin() {
    try {
        const email = 'admin@beautifulwomen.ci';
        const rawPass = 'password123';
        
        const [rows] = await pool.query('SELECT * FROM utilisateurs WHERE email = ?', [email]);
        if (rows.length === 0) {
            console.log('User not found');
            process.exit(1);
        }
        
        const user = rows[0];
        console.log('User found:', user.email, 'Role:', user.role, 'Actif:', user.actif);
        
        const match = await bcrypt.compare(rawPass, user.mot_de_passe);
        console.log('Password match?', match);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

testLogin();
