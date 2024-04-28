import React from 'react';

const ConfirmationModal = ({ onConfirm, onCancel, confirmText, cancelText, message, title }) => {
	return (
		<div className='fixed top-0 z-50 w-full h-full flex justify-center items-center bg-dark/90 px-4'>
			<div className='h-fit flex flex-col space-y-4 p-4 rounded-md bg-dark outline-2 outline outline-darkAccent font-manga'>
				<div className='flex flex-col leading-none'>
					<div className='text-3xl xl:text-4xl text-yellow-300'>{title}</div>
					<div className='text-2xl text-white/40'>{message}</div>
				</div>

				<div className='flex flex-row w-full justify-evenly space-x-4 items-center'>
					<div
						onClick={onCancel}
						className='bg-dark w-full font-sunny text-2xl text-white outline outline-2 outline-red-300 p-2 rounded-md cursor-pointer md:hover:outline-white active:scale-95'>
						{cancelText}
					</div>
					<div
						onClick={onConfirm}
						className='bg-dark w-full font-sunny text-2xl text-white outline outline-2 outline-green-300 p-2 rounded-md cursor-pointer md:hover:outline-white active:scale-95'>
						{confirmText}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConfirmationModal;
