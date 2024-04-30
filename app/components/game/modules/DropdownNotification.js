import React from 'react';

const DropdownNotification = ({ shown, text, bgColorClass = 'bg-green-300' }) => {
	return (
		<h1
			className={`${
				shown ? 'translate-y-0' : '-translate-y-full'
			} absolute w-full text-center transition-all z-50 duration-500 ${bgColorClass} border  text-dark  text-nowrap left-0 top-0 font-manga text-2xl`}>
			{text}
		</h1>
	);
};

export default DropdownNotification;
