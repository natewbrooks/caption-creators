import { useAuth } from '../../contexts/userAuthContext';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UserDisplay({ onClickEnabled, showLoginOption }) {
	const { currentUser } = useAuth();
	const [showError, setShowError] = useState(false);
	const router = useRouter();

	async function handleShowError() {
		try {
			setShowError(true);
			setTimeout(() => {
				setShowError(false);
			}, 3000);
		} catch (error) {}
	}

	return (
		<>
			{!onClickEnabled && (
				<h1
					className={`${
						showError ? 'translate-y-0' : '-translate-y-full'
					} absolute w-full text-center transition-all  duration-500 bg-red-300 border border-b-4 border-dark text-dark xbold left-0 top-0 font-sunny text-2xl`}>
					ERROR - CAN'T ACCESS ACCOUNT IN LOBBY
				</h1>
			)}
			<div
				onClick={() => {
					if (onClickEnabled) {
						if (currentUser) {
							router.push('/profile');
						} else {
							router.push('/login');
						}
					} else {
						handleShowError();
					}
				}}
				className={`${
					onClickEnabled
						? 'cursor-pointer sm:hover:opacity-50 sm:active:scale-95'
						: 'cursor-not-allowed'
				} flex space-x-2 justify-center items-center`}>
				{currentUser ? (
					<>
						<FaUserCircle className={`w-[16px] h-[16px] lg:h-[18px] lg:w-[18px]`} />
						<p className={`font-manga text-xl md:text-2xl`}>{currentUser.displayName}</p>
					</>
				) : (
					showLoginOption && (
						<>
							<FaUserCircle className={`w-[16px] h-[16px] lg:h-[18px] lg:w-[18px]`} />
							<span className={`translate-y-[0.15rem] font-manga text-xl lg:text-2xl`}>LOGIN</span>
						</>
					)
				)}
			</div>
		</>
	);
}
