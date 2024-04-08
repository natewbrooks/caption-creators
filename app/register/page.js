'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/UserAuthContext.js';
import BackButton from '../components/BackButton.js';

export default function RegisterPage() {
	const { register } = useAuth(); // Destructure the register function from context
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState(''); // Assuming you handle username separately
	const [error, setError] = useState('');
	const router = useRouter();

	const handleRegister = async (event) => {
		event.preventDefault();
		setError('');

		try {
			await register(username, email, password);
			// Here, add the code to save the username to your database if needed
			router.push('/'); // Redirect after successful registration
		} catch (error) {
			setError(error.message); // Display any error that occurred during registration
		}
	};

	return (
		<div className={`w-full h-full flex flex-col`}>
			<BackButton />

			<div className='relative w-full h-full flex justify-center items-center'>
				<div className={`w-[400px] h-fit bg-dark p-4 rounded-md`}>
					<h1 className={`text-5xl text-center font-sunny pb-2 border-b-2 border-darkAccent`}>
						REGISTER ACCOUNT
					</h1>
					<form
						onSubmit={handleRegister}
						className={`flex flex-col space-y-6 justify-center items-center py-4`}>
						<div className={`flex flex-col space-y-2 justify-center items-center`}>
							<div className={`flex flex-col text-xl`}>
								<label className={`text-md font-sunny`}>
									<span className={`text-red-300 leading-none `}>* </span>USERNAME
								</label>
								<input
									type='text'
									name='username'
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder=''
									className={`font-manga px-2 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none`}
									required
								/>
							</div>
							<div className={`flex flex-col text-xl`}>
								<label className={`text-md font-sunny`}>
									<span className={`text-red-300 leading-none `}>* </span>EMAIL
								</label>
								<input
									type='email'
									name='email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder=''
									className={`font-manga px-2 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none`}
									required
								/>
							</div>
							<div className={`flex flex-col text-xl`}>
								<label className={`text-md font-sunny`}>
									<span className={`text-red-300 leading-none`}>* </span>PASSWORD
								</label>
								<input
									type='password'
									name='password'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder=''
									className={`font-manga px-2 rounded-md bg-darkAccent text-white placeholder:text-white/30 outline-none`}
									required
								/>
							</div>
						</div>
						<button
							type='submit'
							className={`text-xl font-sunny px-4 text-black bg-green-300 rounded-md w-fit sm:hover:opacity-50 sm:active:scale-95`}>
							SUBMIT
						</button>

						{error && <p className={`text-red-300 font-manga text-xl`}>{error}</p>}
					</form>
					<div
						className={`w-full flex flex-col border-t-2 border-darkAccent pt-4 items-center justify-center`}>
						<span className={`font-manga text-center text-xl select-none`}>
							Already have an account?{' '}
							<span
								onClick={() => router.push('/login')}
								className={`text-yellow-300 cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}>
								Login here.
							</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
