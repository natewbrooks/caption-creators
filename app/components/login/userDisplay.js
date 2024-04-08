import { useAuth } from '../../contexts/UserAuthContext';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UserDisplay({ onClickEnabled }) {
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
					onClickEnabled ? 'cursor-pointer sm:hover:opacity-50 sm:active:scale-95' : ''
				} flex space-x-2 justify-center items-center`}>
				<FaUserCircle size={18} />
				{currentUser ? (
					<p className={`font-manga text-xl`}>{currentUser.displayName}</p>
				) : (
					<span className={`translate-y-[0.15rem] font-manga text-xl cursor-pointer`}>LOGIN</span>
				)}
			</div>
		</>
	);
}
