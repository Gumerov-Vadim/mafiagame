import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Logout from '../Logout';

const Navbar = () => {
    const { user } = useAuth();

    return (
        <nav>
            <a href="/">Главная</a>
            <a href="/guide">Руководство</a>
            {user ? (
                <>
                    {/* Отображаем, если пользователь авторизован */}
                    <a href="/profile">Профиль</a>
                    <Logout />
                </>
            ) : (
                <>
                    {/* Отображаем, если пользователь не авторизован */}
                    <a href="/login">Вход</a>
                    <a href="/signup">Регистрация</a>
                </>
            )}
        </nav>
    );
};

export default Navbar;