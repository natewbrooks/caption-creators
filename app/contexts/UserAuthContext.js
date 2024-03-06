'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import {
	getAuth,
	onAuthStateChanged,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	updateProfile,
	updatePassword,
	updateEmail,
	sendEmailVerification,
} from 'firebase/auth';
import app from '../../server/firebase/auth.js';

export const UserAuthContext = createContext();

export const useAuth = () => useContext(UserAuthContext);

export const UserAuthProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const auth = getAuth(app);

	// Modified register function
	const register = async (username, email, password) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);

			// Now update the profile
			await updateProfile(userCredential.user, {
				displayName: username,
			});

			// Reload the user
			await userCredential.user.reload();

			// Return the updated userCredential for further use
			return userCredential.user;
		} catch (error) {
			// Handle any errors that occur during account creation or profile update
			console.error('Error during user registration and profile update:', error);
			throw error; // Rethrow the error for further handling
		}
	};

	// Modified login function
	const login = (email, password) => {
		return signInWithEmailAndPassword(auth, email, password);
	};

	// Logout function remains unchanged
	const logout = () => signOut(auth);

	const changeUsername = async (newUsername) => {
		// Ensure we're using the correct user object
		const user = auth.currentUser;

		if (!user) {
			throw new Error('Cannot update profile because there is no current user.');
		}

		try {
			// Update the profile with the new username
			await updateProfile(user, {
				displayName: newUsername,
			});

			// Now, refresh the currentUser object from the auth state
			setCurrentUser(auth.currentUser);

			// Alternatively, if you want to trigger a re-render and the state is not updating:
			// setCurrentUser({ ...auth.currentUser });
		} catch (error) {
			console.error('Error updating user profile:', error);
			throw error;
		}
	};

	const changePassword = async (newPassword) => {
		if (!auth.currentUser) {
			throw new Error('No user is signed in');
		}

		try {
			// Firebase function to update the user's password
			await updatePassword(auth.currentUser, newPassword);
		} catch (error) {
			console.error('Error updating password:', error);
			throw error; // Propagate the error so it can be caught by the caller
		}
	};

	const changeEmail = async (newEmail) => {
		const user = auth.currentUser;

		if (!user) {
			throw new Error('No user is signed in.');
		}

		try {
			// First, update the user's email to the new email
			await updateEmail(user, newEmail);

			// Then, send a verification email to the new address
			await sendEmailVerification(user);

			// Inform the user that a verification email has been sent
			console.log('Please check your email to verify the new address.');
		} catch (error) {
			console.error('Error updating email:', error);
			throw error; // Propagate the error so it can be caught by the caller
		}
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user);
			setLoading(false);
		});

		return () => unsubscribe(); // Cleanup subscription on unmount
	}, []);

	const value = {
		currentUser,
		register,
		login,
		logout,
		loading,
		changePassword,
		changeUsername,
		changeEmail,
	};

	return <UserAuthContext.Provider value={value}>{!loading && children}</UserAuthContext.Provider>;
};
