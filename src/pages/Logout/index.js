import React from 'react';
import { auth } from '../../firebase';

const Logout = () => {
    const handleLogout = async () => {
        try {
            await auth.signOut();
            alert('Вы успешно вышли из аккаунта.');
        } catch (error) {
            alert('Ошибка при выходе из аккаунта: ', error.message);
        }
    };

    return (
        <button onClick={handleLogout}>Выйти</button>
    );
};

export default Logout;