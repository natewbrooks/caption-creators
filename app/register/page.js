'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/userAuthContext.js';
import BackButton from '../components/BackButton.js';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';

export default function RegisterPage() {
	const { register, currentUser } = useAuth(); // Destructure the register function from context
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState(''); // Assuming you handle username separately
	const [error, setError] = useState('');
	const router = useRouter();
	const [verifyEmailPrompt, setVerifyEmailPrompt] = useState(false);
	const [emailVerified, setEmailVerified] = useState(false);
	const [passwordShown, setPasswordShown] = useState(true);

	useEffect(() => {
		if (verifyEmailPrompt) {
			const interval = setInterval(async () => {
				await currentUser.reload(); // Force reload of the user object
				if (currentUser.emailVerified) {
					clearInterval(interval);
					setEmailVerified(true);
					setTimeout(() => {
						router.push('/'); // Redirect to home page after 2 seconds of confirming email is verified
					}, 2000);
				}
			}, 4000); // Check every 4 seconds

			return () => clearInterval(interval);
		}
	}, [currentUser, router, verifyEmailPrompt]);

	const handleRegister = async (event) => {
		event.preventDefault();
		setError('');

		try {
			await register(username, email, password);
			setVerifyEmailPrompt(true); // Prompt the user to verify their email
		} catch (error) {
			setError(error.message);
		}
	};

	return (
		<div className={`w-full h-full flex flex-col`}>
			<BackButton
				goHome={false}
				text={'RETURN'}
			/>

			<div className='relative w-full h-full flex justify-center items-center'>
				<div
					className={`w-fit md:min-w-[400px] max-w-[800px] h-fit bg-dark p-4 rounded-md outline outline-2 outline-darkAccent`}>
					{verifyEmailPrompt ? (
						<>
							<h1 className={`text-7xl text-center font-sunny px-4`}>ACCOUNT REGISTERED</h1>
							{emailVerified ? (
								<>
									<h2 className={`pt-2 text-2xl text-center text-white font-manga`}>
										Email verified! Redirecting to home page...
									</h2>
								</>
							) : (
								<>
									<h2 className={`py-2 text-2xl text-center text-white font-manga`}>
										To login, click the link in the email sent to{' '}
										<span className={`text-green-300`}>{email}</span> to verify your account.
									</h2>
									<div className={`flex w-full justify-center items-center pt-4`}>
										<div className={`loadCircle`}></div>
									</div>
								</>
							)}
						</>
					) : (
						<>
							<h1 className={`text-7xl text-center font-sunny px-4`}>REGISTER ACCOUNT</h1>
							<form
								onSubmit={handleRegister}
								className={`flex flex-col space-y-6 justify-center items-center py-4`}>
								<div className={`mb-2 flex flex-col space-y-2 justify-center items-center`}>
									<div className={`flex flex-col text-3xl`}>
										<label className={`text-md text-yellow-300 font-manga text-2xl`}>
											USERNAME:
										</label>
										<input
											type='text'
											name='username'
											value={username}
											onChange={(e) => setUsername(e.target.value)}
											placeholder=''
											className={`font-manga w-[280px] text-center px-2 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none`}
											required
										/>
									</div>
									<div className={`flex flex-col text-3xl`}>
										<label className={`text-md text-yellow-300 font-manga text-2xl`}>EMAIL:</label>
										<input
											type='email'
											name='email'
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder=''
											className={`font-manga w-[280px] text-center px-2 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none`}
											required
										/>
									</div>
									<div className={`flex flex-col text-3xl`}>
										<label className={`text-md text-yellow-300 font-manga text-2xl`}>
											PASSWORD:
										</label>
										<div className='relative w-[280px]'>
											<input
												type={passwordShown ? 'text' : 'password'}
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className='font-manga text-center px-2 pr-8 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none w-full'
											/>
											<div className='absolute inset-y-0 translate-y-1 right-0 pr-2 flex items-center'>
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
									</div>
								</div>
								<button
									type='submit'
									className={`bg-dark p-4 w-full text-center font-sunny text-3xl md:text-4xl cursor-pointer outline-green-300 outline outline-2 rounded-md text-white  sm:hover:outline-white sm:active:scale-95`}>
									SUBMIT
								</button>

								{error && <p className={`text-red-300 font-manga text-xl`}>{error}</p>}
							</form>
							<div className={`w-full flex flex-col items-center justify-center`}>
								<span className={`font-manga text-center text-2xl select-none`}>
									ALREADY HAVE AN ACCOUNT?{' '}
									<span
										onClick={() => router.push('/login')}
										className={`text-[1.75rem] text-yellow-300 font-sunny cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}>
										LOGIN.
									</span>
								</span>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
