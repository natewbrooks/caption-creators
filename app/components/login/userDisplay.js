import { useAuth } from '../../contexts/userAuthContext';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UserDisplay({ onClickEnabled, showLoginOption }) {
	const { currentUser } = useAuth();
	const router = useRouter();

	return (
		<>
			<div
				onClick={() => {
					if (onClickEnabled) {
						if (currentUser) {
							router.push('/profile');
						} else {
							router.push('/login');
						}
					}
				}}
				className={`${
					onClickEnabled
						? 'cursor-pointer sm:hover:opacity-50 sm:active:scale-95'
						: 'cursor-not-allowed'
				} flex space-x-2 justify-center items-center`}>
				{currentUser ? (
					<>
						<FaUserCircle size={18} />
						<p className={`font-manga text-xl`}>{currentUser.displayName}</p>
					</>
				) : (
					showLoginOption && (
						<>
							<FaUserCircle size={18} />
							<span className={`translate-y-[0.15rem] font-manga text-xl`}>LOGIN</span>
						</>
					)
				)}
			</div>
		</>
	);
}
