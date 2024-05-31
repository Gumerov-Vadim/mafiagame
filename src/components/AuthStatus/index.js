import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthStatus = () => {
    const { user } = useAuth();

    return (
        <div>
            {user ? (
                <p>Вы вошли как {user.email}</p>
            ) : (
                <p>Вы не авторизованы</p>
            )}
        </div>
    );
};

export default AuthStatus;