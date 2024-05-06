import React from 'react';
import { FaClock } from 'react-icons/fa6';

export default function TimerInline({ timer }) {
	return (
		<div className={`w-fit h-fit justify-center items-center flex space-x-1`}>
			<div
				className={`bg-dark -translate-y-[0.15rem] p-1 rounded-full space-x-2 flex w-fit justify-center items-center`}>
				<FaClock
					size={14}
					className={``}
				/>
			</div>
			<h1
				data-text={`${timer} seconds left.`}
				className={`font-manga ${
					timer > 10 ? 'text-white' : timer <= 10 && timer >= 5 ? 'text-yellow-300' : 'text-red-300'
				}
`}>
				{timer}
			</h1>
		</div>
	);
}
