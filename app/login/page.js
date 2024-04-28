'use client';
import React, { useState } from 'react';
import { useAuth } from '../contexts/userAuthContext.js';
import { useRouter } from 'next/navigation'; // Correct the import statement
import BackButton from '../components/BackButton.js';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';

export default function LoginPage() {
	const { login, sendPasswordReset } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();
	const [forgotPassword, setForgotPassword] = useState(false);
	const [resetEmailSent, setResetEmailSent] = useState(false);
	const [passwordShown, setPasswordShown] = useState(false);

	const handleLogin = async (event) => {
		event.preventDefault();
		setError('');

		try {
			await login(email, password);
			router.push('/');
		} catch (error) {
			setError(error.message);
		}
	};

	const handlePasswordReset = async (event) => {
		event.preventDefault();
		try {
			await sendPasswordReset(email);
			setResetEmailSent(true);
		} catch (error) {
			setError(error.message);
		}
	};

	return (
		<div className='w-full h-full flex flex-col'>
			<BackButton goHome={false} />

			<div className=' w-full h-full flex justify-center items-center'>
				<div
					className={`w-fit md:min-w-[400px] max-w-[800px] h-fit bg-dark p-4 rounded-md outline outline-4 outline-darkAccent`}>
					{forgotPassword ? (
						resetEmailSent ? (
							<>
								<h1 className={`text-7xl text-center font-sunny pb-2`}>
									PASSWORD RESET EMAIL SENT
								</h1>
								<h2 className={`py-2 text-3xl text-center text-white font-manga`}>
									To complete your password reset, click the link in the email sent to{' '}
									<span className={`text-green-300`}>{email}</span>.
								</h2>
								<div
									onClick={() => setForgotPassword(false)}
									className={`font-sunny cursor-pointer sm:hover:opacity-50 sm:active:scale-95 text-2xl w-full text-center py-1 text-white/40`}>
									RETURN TO LOGIN
								</div>
							</>
						) : (
							<>
								<h1 className={`text-7xl text-center font-sunny`}>FORGOT PASSWORD</h1>
								<form
									onSubmit={handlePasswordReset}
									className={`flex flex-col space-y-4 justify-center items-center py-2`}>
									<div className={`flex flex-col space-y-2 justify-center items-center`}>
										<div className={`flex flex-col text-3xl`}>
											<label className={`text-2xl text-yellow-300 font-manga`}>EMAIL</label>
											<input
												type='email'
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												className={`font-manga px-2 w-[280px] text-center rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none`}
											/>
										</div>
									</div>
									<span
										onClick={() => setForgotPassword(false)}
										className={`font-sunny cursor-pointer sm:hover:opacity-50 sm:active:scale-95 text-2xl text-end text-white/40`}>
										RETURN TO LOGIN
									</span>
									<button
										type='submit'
										className={`bg-dark p-4 w-full text-center font-sunny text-3xl md:text-4xl cursor-pointer outline-green-300 outline outline-2 rounded-md text-white  sm:hover:outline-white sm:active:scale-95`}>
										SEND RESET EMAIL
									</button>

									{error && <p className={`text-red-300 font-manga text-xl`}>{error}</p>}
								</form>
							</>
						)
					) : (
						<>
							<h1 className={`text-7xl text-center font-sunny `}>LOGIN</h1>
							<form
								onSubmit={handleLogin}
								className={`flex flex-col space-y-6 justify-center items-center py-4`}>
								<div className={`flex flex-col space-y-4 justify-center items-center`}>
									<div className={`flex flex-col text-3xl space-y-2`}>
										<label className={`font-manga text-yellow-300 leading-none text-2xl`}>
											EMAIL:
										</label>
										<input
											type='email'
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className={`font-manga w-[280px] text-center px-2 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none`}
										/>
									</div>
									<div className={`flex flex-col text-3xl`}>
										<label className={`font-manga text-yellow-300 leading-none text-2xl`}>
											PASSWORD:
										</label>
										<div className='relative w-full'>
											<input
												type={passwordShown ? 'text' : 'password'}
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className='font-manga w-[280px] text-center px-2 pr-8 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none'
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
										<span
											onClick={() => setForgotPassword(true)}
											className={`font-sunny cursor-pointer sm:hover:opacity-50 sm:active:scale-95 text-2xl text-end pt-1 text-white/40`}>
											FORGOT PASSWORD?
										</span>
									</div>
								</div>
								<button
									type='submit'
									className={`bg-dark p-4 w-full text-center font-sunny text-3xl md:text-4xl cursor-pointer outline-green-300 outline outline-2 rounded-md text-white  sm:hover:outline-white sm:active:scale-95`}>
									SUBMIT
								</button>

								{error && <p className={`text-red-300 font-manga text-xl`}>{error}</p>}
							</form>
						</>
					)}
					<div className={`w-full flex flex-col items-center justify-center`}>
						<span className={`font-manga text-center text-2xl select-none`}>
							DON'T HAVE AN ACCOUNT?{' '}
							<span
								onClick={() => router.push('/register')}
								className={`text-[1.75rem] text-yellow-300 font-sunny cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}>
								REGISTER.
							</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
