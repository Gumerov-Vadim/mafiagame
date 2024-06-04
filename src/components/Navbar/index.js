import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Logout from '../Logout';
import "./Navbar.css"


const Navbar = () => {
    const { user } = useAuth();

    return (
        <nav>
            <div className="nav-left">
                <a href="/">Главная</a>
                <a href="/guide">Руководство</a>
            </div>
            <div className="nav-right">
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
            </div>
        </nav>
    );
};

export default Navbar;
