import { useAuth } from '../../contexts/userAuthContext';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DropdownNotification from '../game/modules/DropdownNotification';

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
				<DropdownNotification
					text={`
					ERROR - CAN'T ACCESS ACCOUNT IN LOBBY
				
				`}
					shown={showError}
					bgColorClass={`bg-red-300`}
				/>
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
						<div className={`bg-dark p-1 rounded-full`}>
							<FaUserCircle className={`w-[16px] h-[16px] lg:h-[18px] lg:w-[18px]`} />
						</div>
						<h1
							data-text={currentUser.displayName}
							className={`font-manga text-xl md:text-2xl`}>
							{currentUser.displayName}
						</h1>
					</>
				) : (
					showLoginOption && (
						<>
							<FaUserCircle className={`w-[16px] h-[16px] lg:h-[18px] lg:w-[18px]`} />
							<h1
								data-text='LOGIN'
								className={`translate-y-[0.15rem] font-manga text-xl lg:text-2xl`}>
								LOGIN
							</h1>
						</>
					)
				)}
			</div>
		</>
	);
}
