import React, { useState } from 'react';
import { auth, db  } from '../../firebase';
import {createUserWithEmailAndPassword} from "firebase/auth"
const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await db.collection('users').doc(userCredential.user.uid).set({
        email: userCredential.user.email,
        role: 'user'  // Роль по умолчанию
      });
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default Signup;
