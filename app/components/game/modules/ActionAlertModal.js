import React from 'react';

const ActionAlertModal = ({ header, subtext, Icon, bgColorClass, onClick }) => {
	return (
		<div className='absolute top-0 bg-dark/80 z-50 w-full h-full flex justify-center items-center'>
			<div
				onClick={() => {
					if (onClick) onClick();
				}}
				className={`w-fit h-fit flex justify-center p-12 ${
					bgColorClass ? bgColorClass : 'bg-green-300'
				} ${
					onClick ? 'sm:hover:outline-white cursor-pointer' : ''
				} outline outline-6 aspect-square outline-dark rounded-full`}>
				<div className='flex flex-col text-center space-y-2 items-center justify-center'>
					<h1
						data-text={header}
						className={`font-sunny text-2xl md:text-3xl text-dark`}>
						{header}
					</h1>
					<Icon
						size={128}
						className='hidden xs:block text-dark'
					/>
					<h1
						data-text={subtext}
						className={`font-sunny text-2xl md:text-3xl text-dark`}>
						{subtext}
					</h1>
				</div>
			</div>
		</div>
	);
};

export default ActionAlertModal;
