import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { auth, db } from '../../firebase';

const withAuth = (Component, role) => {
  return (props) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists && userDoc.data().role === role) {
            setUser(user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, [role]);

    if (loading) return <div>Loading...</div>;

    return user ? <Component {...props} /> : <Redirect to="/login" />;
  };
};

export default withAuth;
