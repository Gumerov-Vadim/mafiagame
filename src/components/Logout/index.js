import React from 'react';
import { auth } from '../../firebase';
import { Button } from '../UI';

const Logout = () => {
    const handleLogout = async () => {
        try {
            await auth.signOut();
            // alert('Вы успешно вышли из аккаунта.');
        } catch (error) {
            console.log(`Ошибка при выходе из аккаунта: ${error.message}`);
        }
    };

    return (
        <Button onClick={handleLogout}>Выйти</Button>
    );
};

export default Logout;