import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa6';
import { useAuth } from '../contexts/userAuthContext';
import { useSocket } from '../contexts/socketContext';

const BackButton = ({ goHome, text = 'RETURN' }) => {
	const router = useRouter();
	const { currentUser } = useAuth();
	const { socket } = useSocket();

	const handleBackButtonClick = () => {
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
			<div className={`bg-dark p-1 rounded-full`}>
				<FaArrowLeft className={`w-[16px] h-[16px] lg:h-[18px] lg:w-[18px]`} />
			</div>
			<h1
				data-text={text}
				className={`font-manga text-xl lg:text-2xl`}>
				{text}
			</h1>
		</div>
	);
};

export default BackButton;
