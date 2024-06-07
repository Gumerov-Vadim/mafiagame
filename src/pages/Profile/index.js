import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '../../components/UI';
import Navbar from '../../components/Navbar';
import './style.css'; // Подключаем файл со стилями

const Profile = () => {
    const { user } = useAuth();
    const [userData, setUserData] = useState(null);
    const [status, setStatus] = useState('');
    const [gender, setGender] = useState('');
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const docRef = doc(db, 'user', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserData(data);
                    setStatus(data.status);
                    setGender(data.gender);
                }
            }
        };

        try {
            fetchUserData();
        } catch (e) {
            console.log(`error fetch user data: ${e}`);
        }
    }, [user]);

    const handleStatusChange = async () => {
        if (user) {
            const userDocRef = doc(db, 'user', user.uid);
            await updateDoc(userDocRef, {
                status,
                gender
            });
            setEditMode(false);
        }
    };

    if (!user) {
        return <p>Вы не авторизованы</p>;
    }

    return (
       <div>
            <Navbar /> <div className="profile-container">
            {userData ? (
                <div className="profile-content">
                    <p>Имя: {userData.name}</p>
                    <p>Почта: {userData.email}</p>
                    <p>
                        Статус:
                        {editMode ? (
                            <input
                                type="text"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            />
                        ) : (
                            userData.status || "Статус не установлен"
                        )}
                    </p>
                    <p>
                        Пол:
                        {editMode ? (
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        value="Мужской"
                                        checked={gender === 'Мужской'}
                                        onChange={(e) => setGender(e.target.value)}
                                    />
                                    Мужской
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        value="Женский"
                                        checked={gender === 'Женский'}
                                        onChange={(e) => setGender(e.target.value)}
                                    />
                                    Женский
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        value="Неопределён"
                                        checked={gender === 'Неопределён'}
                                        onChange={(e) => setGender(e.target.value)}
                                    />
                                    Неопределён
                                </label>
                            </div>
                        ) : (
                            userData.gender || "Пол не указан"
                        )}
                    </p>
                    {editMode ? (
                        <Button onClick={handleStatusChange}>Сохранить</Button>
                    ) : (
                        <Button onClick={() => setEditMode(true)}>Редактировать</Button>
                    )}
                </div>
            ) : (
                <p>Загрузка...</p>
            )}
        </div>
        </div>
    );
};

export default Profile;