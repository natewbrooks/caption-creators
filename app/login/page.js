'use client';
import React, { useState } from 'react';
import { useAuth } from '../contexts/UserAuthContext.js';
import { useRouter } from 'next/navigation';
import BackButton from '../components/BackButton.js';

export default function LoginPage() {
	const { login } = useAuth(); // Use the login function from context
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();

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

	return (
		<div className={`w-full h-full flex flex-col`}>
			<BackButton />

			<div className='relative w-full h-full flex justify-center items-center'>
				<div className={`w-[400px] h-fit bg-dark p-4 rounded-md`}>
					<h1 className={`text-5xl text-center font-sunny pb-2 border-b-2 border-darkAccent`}>
						LOGIN
					</h1>
					<form
						onSubmit={handleLogin}
						className={`flex flex-col space-y-4 justify-center items-center py-4`}>
						<div className={`flex flex-col space-y-2 justify-center items-center`}>
							<div className={`flex flex-col text-xl`}>
								<label className={`text-md font-sunny`}>EMAIL</label>
								<input
									type='email'
									name='email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder=''
									className={`font-manga px-2 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none`}
								/>
							</div>
							<div className={`flex flex-col text-xl`}>
								<label className={`text-md font-sunny`}>PASSWORD</label>
								<input
									type='password'
									name='password'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder=''
									className={`font-manga px-2 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none`}
								/>
								<span
									className={`font-sunny cursor-pointer sm:hover:opacity-50 sm:active:scale-95 text-sm text-end pt-1 text-white/40`}>
									FORGOT PASSWORD?
								</span>
							</div>
						</div>
						<button
							type='submit'
							className={`text-xl font-sunny px-4 text-black bg-green-300 rounded-md w-fit outline-2 outline-darkAccent outline sm:hover:outline-white sm:active:scale-95`}>
							SUBMIT
						</button>

						{error && <p className={`text-red-300 font-manga text-xl`}>{error}</p>}
					</form>
					<div
						className={`w-full flex flex-col border-t-2 border-darkAccent pt-4 items-center justify-center`}>
						<span className={`font-manga text-center text-xl select-none`}>
							Don't have an account?{' '}
							<span
								onClick={() => router.push('/register')}
								className={`text-yellow-300 cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}>
								Register now.
							</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
