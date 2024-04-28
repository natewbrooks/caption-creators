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
	sendPasswordResetEmail,
	EmailAuthProvider,
	reauthenticateWithCredential,
} from 'firebase/auth';
import app from '../../server/firebase/auth.js';

export const UserAuthContext = createContext();

export const useAuth = () => useContext(UserAuthContext);

export const UserAuthProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const auth = getAuth(app);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user);
			setLoading(false);
		});

		return unsubscribe;
	}, [auth]);

	const refreshUser = async () => {
		await auth.currentUser?.reload();
		setCurrentUser(auth.currentUser);
	};

	const reauthenticate = async (password) => {
		if (!currentUser) {
			console.error('No user is signed in to reauthenticate.');
			return false;
		}

		try {
			const credential = EmailAuthProvider.credential(currentUser.email, password);
			await reauthenticateWithCredential(currentUser, credential);
			await refreshUser();
			return true;
		} catch (error) {
			console.error('Reauthentication error:', error);
			return false;
		}
	};

	const register = async (username, email, password) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			await updateProfile(userCredential.user, { displayName: username });
			await sendEmailVerification(userCredential.user);
			await signOut(auth);

			// Listen for email verification before proceeding
			onAuthStateChanged(auth, async (user) => {
				if (user && user.emailVerified) {
					// Email is verified, add user details to the database
					const response = await fetch('/api/users/', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ username, email }),
					});

					const data = await response.json();
					if (data.error) {
						throw new Error(data.error);
					}
					setCurrentUser(user);
					console.log('User registered and verified:', user);
				}
			});
		} catch (error) {
			console.error('Registration error:', error);
			throw error;
		}
	};

	const login = async (email, password) => {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			setCurrentUser(userCredential.user);
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		}
	};

	const logout = async () => {
		try {
			await signOut(auth);
			setCurrentUser(null);
		} catch (error) {
			console.error('Logout error:', error);
			throw error;
		}
	};

	// Change this to update the user and leaderboard databases with the logged in users userToken and the newUsername
	const changeUsername = async (newUsername) => {
		if (!currentUser) {
			throw new Error('No user is signed in');
		}
		const currentUsername = currentUser.displayName;

		try {
			const response = await fetch('/api/users/', {
				// Make sure this URL is correct
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ currentUsername, newUsername }),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || 'Failed to update username');
			}

			// If the update is successful, update the user's profile on the client side
			await updateProfile(currentUser, { displayName: newUsername }); // Assuming `updateProfile` handles client-side profile update
			setCurrentUser({ ...currentUser, displayName: newUsername, username: newUsername }); // Update both displayName and username in state
			await refreshUser(); // Optionally refresh user data if needed

			console.log('Username update successful:', data.message);
		} catch (error) {
			console.error('Username update error:', error.message);
			throw error;
		}
	};

	const changePassword = async (newPassword) => {
		if (!currentUser) {
			throw new Error('No user is signed in');
		}
		try {
			await updatePassword(currentUser, newPassword);
			await refreshUser();
		} catch (error) {
			console.error('Password update error:', error);
			throw error;
		}
	};

	// const emailAlreadyExists = async (email) => {
	// 	const signInMethods = await fetchSignInMethodsForEmail(auth, email);
	// 	return signInMethods.length > 0;
	// };

	// const changeEmail = async (newEmail, password) => {
	// 	if (!currentUser) {
	// 		console.error('No user is signed in');
	// 		throw new Error('No user is signed in');
	// 	}

	// 	try {
	// 		const credential = EmailAuthProvider.credential(currentUser.email, currentUser.password);
	// 		await reauthenticateWithCredential(currentUser, credential);
	// 	} catch (reauthError) {
	// 		console.error('Reauthentication failed:', reauthError);
	// 		throw new Error('Reauthentication failed, please try again.');
	// 	}

	// 	if (await emailAlreadyExists(newEmail)) {
	// 		throw new Error('This email is already used by another account');
	// 	}

	// 	try {
	// 		await updateEmail(currentUser, newEmail);
	// 		await sendEmailVerification(currentUser);
	// 		console.log('Email updated and verification sent.');
	// 	} catch (updateError) {
	// 		console.error('Email update error:', updateError);
	// 		throw updateError;
	// 	}
	// };

	const sendPasswordReset = async (email) => {
		try {
			await sendPasswordResetEmail(auth, email);
		} catch (error) {
			console.error('Password reset error:', error);
			throw error;
		}
	};

	const value = {
		reauthenticate,
		currentUser,
		register,
		login,
		logout,
		changePassword,
		changeUsername,
		// changeEmail,
		sendPasswordReset,
		loading,
		refreshUser,
	};

	return <UserAuthContext.Provider value={value}>{!loading && children}</UserAuthContext.Provider>;
};
