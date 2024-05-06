'use client';
import { useAuth } from '../contexts/userAuthContext';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '../components/game/modules/BackButton';
import { ImExit } from 'react-icons/im';
import { FaEdit } from 'react-icons/fa';
import { FaArrowRight, FaEyeSlash, FaEye, FaXmark } from 'react-icons/fa6';
import { FaCheck, FaLock } from 'react-icons/fa';

export default function ProfilePage() {
	const router = useRouter();
	const { currentUser, changeUsername, changePassword, reauthenticate, logout, sendPasswordReset } =
		useAuth();
	const [editingProfile, setEditingProfile] = useState(false);
	const [editUsername, setEditUsername] = useState(currentUser?.displayName || '');
	const [editPassword, setEditPassword] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');
	const [currentEmail, setCurrentEmail] = useState('');
	const [error, setError] = useState('');
	const [promptReauthenticate, setPromptReauthenticate] = useState(false);
	const [reauthenticatedPassword, setReauthenticatedPassword] = useState(false);
	const [forgotPassword, setForgotPassword] = useState(false);
	const [resetEmailSent, setResetEmailSent] = useState(false);
	const [passwordShown, setPasswordShown] = useState(false);

	// const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{6,}$/;

	const handleUpdateProfile = async () => {
		if (!editingProfile) {
			setEditingProfile(true);
			setPromptReauthenticate(true);
		} else {
			try {
				if (editUsername !== currentUser.displayName && editUsername.length >= 3) {
					await changeUsername(editUsername);
				} else if (editUsername.length < 3) {
					setEditUsername('');
					throw new Error('Username must be at least 3 characters.');
				}

				if (editPassword && !editPassword.length >= 6) {
					setEditPassword('');
					throw new Error('Password must be at least 6 characters long!');
				} else if (editPassword && editPassword !== currentUser.password) {
					await changePassword(editPassword);
				}

				// Exit editing mode on successful update
				setEditingProfile(false);
				setReauthenticatedPassword(false);
				setPromptReauthenticate(false);
				setError('');
			} catch (error) {
				setError(error.message);
			}
		}
	};

	const handleReauthenticate = async (password) => {
		try {
			const auth = await reauthenticate(currentPassword);
			if (auth) {
				setPromptReauthenticate(false);
				setReauthenticatedPassword(true);
				setError('');
			} else {
				setError('That is not your accounts current password!');
			}
		} catch (error) {
			setError(error.message);
		}
	};

	const handlePasswordReset = async (event) => {
		event.preventDefault();
		try {
			await sendPasswordReset(currentEmail);
			setResetEmailSent(true);
		} catch (error) {
			setError(error.message);
		}
	};

	return (
		<div className='w-full h-full flex flex-col'>
			<BackButton
				goHome={false}
				text={'RETURN'}
			/>
			<div className='w-full h-full flex flex-col justify-center items-center'>
				{currentUser ? (
					<div className='flex flex-col items-center w-full h-full md:w-[80%] lg:w-[70%] py-4'>
						<div className='w-full flex justify-center text-center'>
							<h1
								data-text='PROFILE'
								className='w-fit text-5xl md:text-6xl font-sunny text-center'>
								PROFILE
							</h1>
						</div>

						<div className='relative max-w-[800px] mt-4 space-y-2 bg-dark outline-2 outline outline-darkAccent rounded-md flex flex-col w-full h-fit text-white p-2'>
							{promptReauthenticate ? (
								forgotPassword ? (
									resetEmailSent ? (
										<>
											<div
												onClick={() => {
													setPromptReauthenticate(false);
													setResetEmailSent(false);
													setForgotPassword(false);
												}}
												className='absolute top-2 right-2 cursor-pointer'>
												<FaXmark size={20} />
											</div>
											<div className={``}>
												<h1 className='w-full justify-center text-2xl font-sunny text-center text-yellow-300 leading-none'>
													PASSWORD RESET EMAIL SENT
												</h1>
												<h2 className={`text-2xl text-center text-white font-manga`}>
													To complete your password reset, click the link in the email sent to{' '}
													<span className={`text-yellow-300`}>{currentEmail}</span>.
												</h2>
											</div>

											<div className={`w-full flex justify-center items-center`}>
												<span
													onClick={() => {
														setForgotPassword(false);
														setResetEmailSent(false);
													}}
													className={`font-sunny cursor-pointer sm:hover:opacity-50 sm:active:scale-95 text-2xl text-center w-fit text-white/40`}>
													RETURN TO RE-AUTHENTICATION
												</span>
											</div>
										</>
									) : (
										<>
											<div
												onClick={() => {
													setPromptReauthenticate(false);
													setResetEmailSent(false);
													setForgotPassword(false);
												}}
												className='absolute top-2 right-2 cursor-pointer'>
												<FaXmark size={20} />
											</div>
											<div className={``}>
												<h1 className='w-full justify-center text-3xl font-sunny text-center text-yellow-300 leading-none'>
													FORGOT PASSWORD
												</h1>
												<h1 className={`text-2xl text-center text-white font-manga`}>
													CONFIRM RESET EMAIL:{' '}
													<span className={`text-yellow-300`}>{currentUser.email}</span>.
												</h1>
											</div>
											<form
												onSubmit={handlePasswordReset}
												className={`mt-2 flex flex-col space-y-4 justify-center items-center`}>
												<div className={`flex space-x-1 justify-center`}>
													<input
														type='email'
														placeholder='Email address'
														value={currentEmail}
														onChange={(e) => setCurrentEmail(e.target.value)}
														onKeyDown={(e) => {
															if (e.key === 'Enter') {
																setCurrentEmail(e.target.value);
															}
														}}
														className='outline-none w-[240px] font-manga text-2xl text-center placeholder:text-md bg-darkAccent text-white px-2 rounded-md'
													/>
													<button
														type='submit'
														className='bg-yellow-300 select-none outline-none px-2 py-1 rounded-md font-sunny text-xl text-dark outline-2 outline-offset-2 sm:hover:outline-white sm:hover:outline sm:active:scale-95'>
														<FaArrowRight size={20} />
													</button>
												</div>

												<div className={`w-full flex justify-center items-center`}>
													<span
														onClick={() => setForgotPassword(false)}
														className={`font-sunny cursor-pointer sm:hover:opacity-50 sm:active:scale-95 text-2xl text-center w-fit text-white/40`}>
														RETURN TO RE-AUTHENTICATION
													</span>
												</div>
											</form>
										</>
									)
								) : (
									<>
										<div
											onClick={() => {
												setPromptReauthenticate(false);
												setEditingProfile(false);
											}}
											className='absolute top-2 right-2 cursor-pointer'>
											<FaXmark size={20} />
										</div>
										<div className='flex flex-col w-full items-center'>
											<h1 className='w-fit text-3xl font-sunny text-center text-yellow-300 '>
												ENTER CURRENT PASSWORD
											</h1>
											<h1 className='w-fit text-xl font-manga text-center'>
												REAUTHENTICATE TO EDIT ACCOUNT INFO
											</h1>
										</div>
										<form
											onSubmit={(e) => e.preventDefault()}
											className='flex w-full justify-center space-x-1'>
											<div className='relative'>
												<input
													type={passwordShown ? 'text' : 'password'}
													placeholder='Current password'
													value={currentPassword}
													onChange={(e) => setCurrentPassword(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															handleReauthenticate(currentPassword);
														}
													}}
													className='outline-none w-[280px] text-center font-manga text-2xl placeholder:text-md bg-darkAccent text-white px-2 pr-8 rounded-md'
												/>
												<div className='absolute inset-y-0 right-0 pr-2 flex items-center'>
													{passwordShown ? (
														<FaEye
															onClick={() => setPasswordShown(false)}
															size={24}
															className='text-white cursor-pointer sm:active:scale-95'
														/>
													) : (
														<FaEyeSlash
															onClick={() => setPasswordShown(true)}
															size={24}
															className='text-white cursor-pointer sm:active:scale-95'
														/>
													)}
												</div>
											</div>

											<button
												onClick={() => handleReauthenticate(currentPassword)}
												className='bg-yellow-300 select-none outline-none px-2 rounded-md font-sunny text-xl text-dark outline-2 outline-offset-2 sm:hover:outline-white sm:hover:outline sm:active:scale-95'>
												<FaArrowRight size={20} />
											</button>
										</form>
										<div className={`w-full flex justify-center items-center`}>
											<span
												onClick={() => setForgotPassword(true)}
												className={`font-sunny cursor-pointer sm:hover:opacity-50 sm:active:scale-95 text-2xl text-center w-fit pt-1 text-white/40`}>
												FORGOT PASSWORD?
											</span>
										</div>
									</>
								)
							) : editingProfile && reauthenticatedPassword ? (
								<>
									<div className='font-manga text-2xl flex space-x-2 items-center'>
										<FaLock
											size={24}
											className={`-translate-y-[0.15rem]`}
										/>
										<span className='text-yellow-300'>EMAIL:</span>
										<span className='font-manga'>{currentUser.email}</span>
									</div>
									<div className='font-manga text-2xl flex space-x-2 items-center'>
										<span className='text-yellow-300'>USERNAME:</span>
										<input
											type='text'
											placeholder={currentUser.displayName}
											value={editUsername}
											onChange={(e) => setEditUsername(e.target.value)}
											className='outline-none w-[240px] font-manga text-2xl placeholder:text-md bg-darkAccent text-white px-2 rounded-md'
										/>
									</div>
									<form
										onSubmit={(e) => e.preventDefault()}
										className='font-manga text-2xl flex space-x-2 items-center'>
										<span className='text-yellow-300'>PASSWORD:</span>
										<div className='relative w-[240px]'>
											<input
												type={passwordShown ? 'text' : 'password'}
												placeholder='New password'
												value={editPassword}
												onChange={(e) => setEditPassword(e.target.value)}
												className='outline-none w-full font-manga text-2xl placeholder:text-md bg-darkAccent text-white px-2 pr-8 rounded-md'
											/>
											<div className='absolute inset-y-0 right-0 pr-2 flex items-center'>
												{passwordShown ? (
													<FaEye
														onClick={() => setPasswordShown(false)}
														size={24}
														className='text-white cursor-pointer sm:active:scale-95'
													/>
												) : (
													<FaEyeSlash
														onClick={() => setPasswordShown(true)}
														size={24}
														className='text-white cursor-pointer sm:active:scale-95'
													/>
												)}
											</div>
										</div>
									</form>
								</>
							) : (
								<>
									<div className='font-manga text-2xl flex space-x-2 items-center'>
										<span className='text-yellow-300'>EMAIL:</span>
										<span className=''>{currentUser.email}</span>
									</div>
									<div className='font-manga text-2xl flex items-center'>
										<span className='text-yellow-300'>USERNAME:</span>
										<span className='px-2'>{currentUser.displayName}</span>
									</div>
									<div className='font-manga text-2xl flex space-x-2 items-center'>
										<span className='text-yellow-300'>PASSWORD:</span>
										<span className='translate-y-1'>*********</span>
									</div>
								</>
							)}
						</div>
						{error && (
							<div className='bg-dark py-1 px-2 outline outline-2 outline-darkAccent rounded-md text-red-300 text-lg md:text-xl mt-4 font-manga'>
								ERROR: {error}
							</div>
						)}

						{promptReauthenticate ? (
							''
						) : (
							<div className='text-center select-none max-w-[800px] w-full flex space-x-3 mt-4 justify-center sm:justify-end'>
								<div
									onClick={handleUpdateProfile}
									className='w-fit flex justify-center items-center'>
									<div
										className={`leading-none bg-dark p-2 w-full flex space-x-2 items-center justify-center text-center font-sunny text-2xl rounded-md ${
											editingProfile
												? 'outline-green-300 text-green-300'
												: 'text-white outline-yellow-300'
										}  cursor-pointer outline outline-2  sm:hover:outline-white sm:active:scale-95`}>
										{editingProfile ? 'CONFIRM CHANGES' : 'EDIT PROFILE'}
									</div>
								</div>
								<div
									onClick={() => {
										logout();
										router.push('/');
									}}
									className='w-fit flex justify-center items-center'>
									<div
										className={`leading-none bg-dark p-2 w-full flex space-x-2 items-center justify-center text-center font-sunny text-2xl rounded-md text-white cursor-pointer outline outline-2 outline-red-300  sm:hover:outline-white sm:active:scale-95`}>
										SIGN OUT
									</div>
								</div>
							</div>
						)}
					</div>
				) : (
					<h1 className='text-5xl font-sunny'>
						<span
							onClick={() => router.push('/login')}
							className='text-green-300 cursor-pointer sm:hover:opacity-50 sm:active:scale-95 underline underline-4 underline-offset-8 rounded-md'>
							LOGIN
						</span>{' '}
						TO SEE ACCOUNT PROFILE
					</h1>
				)}
			</div>
		</div>
	);
}
