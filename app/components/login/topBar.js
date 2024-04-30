import { useAuth } from '../../contexts/userAuthContext';
import { useRouter } from 'next/navigation';
import BackButton from '../BackButton';
import UserDisplay from './userDisplay';

export default function TopBar({
	userOnClickEnabled,
	backButtonGoHome,
	backButtonText,
	showLoginOption,
}) {
	const { currentUser } = useAuth();

	// Determine whether to show the login option
	const shouldShowLogin = showLoginOption && !!currentUser;

	return (
		<div className={`flex w-full justify-between mb-2`}>
			<BackButton
				goHome={backButtonGoHome}
				text={backButtonText}
			/>
			<UserDisplay
				onClickEnabled={userOnClickEnabled}
				showLoginOption={shouldShowLogin}
			/>
		</div>
	);
}
