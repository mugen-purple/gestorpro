function verificar() {

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    let z = document.getElementById('text');

    if (email === '' || password === '') {

        z.textContent = 'Preencha os campos para entrar!';
        z.style.color = 'red';

    } else {

        z.textContent = 'Login realizado com sucesso!';
        z.style.color = 'green';

        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1000);

    }
}