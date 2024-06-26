import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Navbar from '../../components/Navbar';
import {Input, Button} from '../../components/UI'
import "./Login.css"
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);

            navigate(`/`);
        } catch (error) {
          setError(error.message);
        }
    };

    return (
        <div>
          <Navbar style={{position:'fixed'}}/>
          <div style={{display:'flex',justifyContent:'flex-start',flexDirection:'column',alignItems:'center',height:'100vh',paddingTop:'100px'}}>
            <h2>Авторизация</h2>
            <form onSubmit={handleSubmit}>
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                />
                <Button type="submit">Войти</Button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
            </div>
            </div>
    );
}

export default Login;