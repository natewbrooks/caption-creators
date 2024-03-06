'use client';
import { useAuth } from '../contexts/UserAuthContext';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '../components/BackButton.js';
import { ImExit } from 'react-icons/im';
import { FaEdit } from 'react-icons/fa';

export default function ProfilePage() {
	const router = useRouter();
	const { currentUser, changeUsername, changeEmail, logout } = useAuth();
	const [editingProfile, setEditingProfile] = useState(false);
	const [editUsername, setEditUsername] = useState(currentUser?.displayName || '');
	const [editEmail, setEditEmail] = useState(currentUser?.email || '');
	const [error, setError] = useState(''); // Make sure this state is defined to store potential errors

	const handleUpdateProfile = async () => {
		if (editingProfile) {
			try {
				await changeUsername(editUsername);
				setEditingProfile(false); // Exit editing mode on successful update
			} catch (error) {
				setError(error.message);
			}
		} else {
			setEditingProfile(true); // Enter editing mode
		}
	};

	return (
		<div className={`w-full h-full flex flex-col`}>
			<BackButton />

			<div className='w-full h-full flex flex-col justify-center items-center'>
				{currentUser ? (
					<div className={`flex flex-col w-full h-full px-4 sm:px-20 py-4`}>
						<h1 className={`text-5xl font-sunny text-center`}>PROFILE</h1>

						<div className={`flex flex-col w-full h-full text-white py-8`}>
							<div className={`font-sunny text-2xl`}>
								<span className={`text-blue-300`}>USERNAME:</span>
								{editingProfile ? (
									<input
										value={editUsername}
										onChange={(e) => setEditUsername(e.target.value)}
										placeholder={currentUser.displayName}
										className={`outline-none px-2 font-manga rounded-md bg-white/10`}></input>
								) : (
									<span className={`px-2 font-manga`}>{currentUser.displayName}</span>
								)}
							</div>

							<div className={`font-sunny text-2xl`}>
								<span className={`text-green-300`}>EMAIL:</span>
								<span className={`font-manga`}> {currentUser.email}</span>
							</div>

							{/* <div className={`font-sunny text-2xl`}>
								PASSWORD: <span className={`font-manga`}>{currentUser.password}</span>
							</div> */}
						</div>

						<div className={`select-none w-full flex space-x-2 justify-center sm:justify-end`}>
							<div
								onClick={handleUpdateProfile}
								className={`w-fit flex justify-center items-center`}>
								<div
									className={`flex justify-center items-center text-black font-sunny text-xl bg-white px-2 rounded-md cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}>
									<div className={`mr-1`}>
										<FaEdit size={20} />
									</div>
									{editingProfile ? 'CONFIRM' : 'EDIT PROFILE'}
								</div>
							</div>
							<div
								onClick={() => {
									logout();
									router.push('/');
								}}
								className={`w-fit flex justify-center items-center`}>
								<div
									className={`flex justify-center items-center text-black font-sunny text-xl bg-red-300 px-2 rounded-md cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}>
									<div className={`mr-1`}>
										<ImExit size={20} />
									</div>
									SIGN OUT
								</div>
							</div>
						</div>
					</div>
				) : (
					<h1 className={`text-5xl font-sunny`}>
						<span
							onClick={() => router.push('/login')}
							className={`text-green-300 cursor-pointer sm:hover:opacity-50 sm:active:scale-95 underline underline-4 underline-offset-8 rounded-md`}>
							LOGIN
						</span>{' '}
						TO SEE ACCOUNT PROFILE
					</h1>
				)}
			</div>
		</div>
	);
}
