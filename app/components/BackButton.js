import { getSocket } from '@/server/socketManager';
import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa6';

const BackButton = () => {
	const router = useRouter();

	const handleBackButtonClick = () => {
		// Emit the disconnect event
		getSocket().emit('leave_lobby');

		// Navigate back
		router.back();
	};

	return (
		<div
			onClick={handleBackButtonClick}
			className={`flex w-fit items-center text-white cursor-pointer sm:hover:opacity/50 sm:active:scale-95`}>
			<FaArrowLeft
				size={18}
				className={`mr-2`}
			/>
			<span className={`font-sunny text-2xl`}>RETURN</span>
		</div>
	);
};

export default BackButton;
