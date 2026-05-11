// Native fetch is used (Node 18+)

async function testRegistration() {
    const url = 'http://localhost:3000/api/auth/inscription';
    const payload = {
        nom: 'Test User',
        email: `test_${Date.now()}@example.com`,
        mot_de_passe: 'password123',
        role: 'vendeur',
        telephone: '0102030405',
        nom_boutique: 'Ma Boutique Test',
        localisation: 'Abidjan'
    };

    console.log('Testing registration with:', payload);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testRegistration();
