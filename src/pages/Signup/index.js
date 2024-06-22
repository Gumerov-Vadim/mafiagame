import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import Navbar from '../../components/Navbar';
import { Button, Input } from '../../components/UI';
import './Signup.css';
const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user info in Firestore
            await setDoc(doc(db, 'user', user.uid), {
                name,
                email,
                status: '' // Initialize status as empty string
            });

            navigate(`/`);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div>
            <Navbar style={{position:'fixed'}}/>
            <div style={{display:'flex',justifyContent:'flex-start',flexDirection:'column',alignItems:'center',height:'100vh',paddingTop:'100px'}}>
            <h2>Регистрация</h2>
            <form onSubmit={handleSubmit}>
                <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Имя"
                />
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
                <Button type="submit">Зарегистрироваться</Button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </div>
    );
}

export default Signup;
