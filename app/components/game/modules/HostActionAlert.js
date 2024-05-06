import React from 'react';
import { FaWalking } from 'react-icons/fa';

const HostActionAlert = ({ header, subtext }) => {
	return (
		<div className='absolute top-0 bg-dark/80 z-50 w-full h-full flex justify-center items-center'>
			<div className='w-fit h-fit flex justify-center p-12 bg-green-300 outline outline-6 aspect-square outline-dark rounded-full'>
				<div className='flex flex-col text-center space-y-2 items-center justify-center'>
					<h1
						data-text={header}
						className={`font-sunny text-2xl md:text-3xl text-dark`}>
						{header}
					</h1>
					<FaWalking
						size={108}
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

export default HostActionAlert;
