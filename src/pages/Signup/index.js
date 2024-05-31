import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Navbar from '../../components/Navbar';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate(`/`);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div>
          <Navbar/>
            <h2>Регистрация</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
           <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                />
                <button type="submit">Зарегистрироваться</button>
            </form>
        </div>
    );
}

export default Signup;