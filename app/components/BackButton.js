import { getSocket } from '@/server/socketManager';
import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa6';
import { useAuth } from '../contexts/userAuthContext';

const BackButton = (goHome) => {
	const router = useRouter();
	const { currentUser } = useAuth();

	const handleBackButtonClick = () => {
		const socket = getSocket(currentUser);
		socket.emit('leave_lobby');

		if (!goHome) {
			// Navigate back 1 step
			router.back();
		} else {
			router.push('/'); // Always go home if goHome is true
		}
	};

	return (
		<div
			onClick={handleBackButtonClick}
			className={`flex space-x-2 w-fit items-center text-white cursor-pointer sm:hover:opacity/50 sm:active:scale-95`}>
			<FaArrowLeft className={`h-[18px] w-[18px] lg:h-[24px] lg:w-[24px]`} />
			<span className={`font-manga text-2xl lg:text-3xl`}>RETURN</span>
		</div>
	);
};

export default BackButton;
