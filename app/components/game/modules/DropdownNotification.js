import React from 'react';

const DropdownNotification = ({ shown, text, bgColorClass = 'bg-green-300' }) => {
	return (
		<h1
			className={`${
				shown ? 'translate-y-0' : '-translate-y-full'
			} absolute w-full text-center transition-all  duration-500 ${bgColorClass} border border-b-4 border-dark text-dark xbold text-nowrap left-0 top-0 font-manga text-2xl`}>
			{text}
		</h1>
	);
};

export default DropdownNotification;
