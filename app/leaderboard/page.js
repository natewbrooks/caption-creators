'use client';
import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/UserAuthContext.js';
import { useRouter } from 'next/navigation';
import BackButton from '../components/BackButton.js';
import { FaSearch, FaUserCircle } from 'react-icons/fa';
import { IoFilter } from 'react-icons/io5';
import { FixedSizeList as List } from 'react-window';
import { FaTrophy } from 'react-icons/fa6';
import UserDisplay from '../components/login/userDisplay.js';

export default function LeaderboardPage() {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState('');
	const { currentUser } = useAuth();
	const [isDescending, setIsDescending] = useState(true);

	// Temporary dataset (replace with leaderboard database)
	let users = [
		{ username: 'papa', score: 610140 },
		{ username: 'sierra quebec', score: 714969 },
		{ username: 'alpha xray quebec', score: 444091 },
		{ username: 'papa sierra hotel', score: 33315 },
		{ username: 'oscar mike beta', score: 710399 },
		{ username: 'romeo xray delta', score: 980923 },
		{ username: 'romeo kilo yankee', score: 705843 },
		{ username: 'alpha', score: 526526 },
		{ username: 'charlie juliet', score: 598600 },
		{ username: 'oscar', score: 731998 },
		{ username: 'papa', score: 402815 },
		{ username: 'beta', score: 108929 },
		{ username: 'november', score: 350914 },
		{ username: 'tango oscar', score: 744203 },
		{ username: 'mike', score: 914170 },
		{ username: 'foxtrot quebec', score: 263373 },
		{ username: 'uniform romeo hotel', score: 300903 },
		{ username: 'whiskey hotel kilo', score: 254963 },
		{ username: 'sierra', score: 706217 },
		{ username: 'mike', score: 800129 },
		{ username: 'xray hotel', score: 417836 },
		{ username: 'india xray alpha', score: 701016 },
		{ username: 'quebec juliet', score: 386481 },
		{ username: 'juliet hotel', score: 524850 },
		{ username: 'november uniform papa', score: 919164 },
		{ username: 'sierra tango', score: 693529 },
		{ username: 'hotel', score: 760530 },
		{ username: 'alpha yankee lima', score: 834778 },
		{ username: 'delta mike', score: 940851 },
		{ username: 'hotel xray', score: 636722 },
		{ username: 'alpha charlie whiskey', score: 941611 },
		{ username: 'echo', score: 926750 },
		{ username: 'tango india hotel', score: 378775 },
		{ username: 'hotel alpha beta', score: 492394 },
		{ username: 'whiskey oscar', score: 657332 },
		{ username: 'mike foxtrot', score: 435744 },
		{ username: 'charlie uniform golf', score: 264520 },
		{ username: 'whiskey xray echo', score: 226872 },
		{ username: 'golf echo', score: 647357 },
		{ username: 'lima', score: 942869 },
		{ username: 'delta', score: 484873 },
		{ username: 'lima hotel', score: 185810 },
		{ username: 'whiskey tango zulu', score: 205122 },
		{ username: 'zulu charlie', score: 540182 },
		{ username: 'lima', score: 383816 },
		{ username: 'oscar oscar', score: 316439 },
		{ username: 'beta', score: 451295 },
		{ username: 'november whiskey', score: 379756 },
		{ username: 'november', score: 44492 },
		{ username: 'whiskey', score: 272978 },
		{ username: 'charlie', score: 920810 },
		{ username: 'uniform papa lima', score: 875198 },
		{ username: 'oscar mike lima', score: 9835 },
		{ username: 'oscar delta zulu', score: 762973 },
		{ username: 'india mike golf', score: 827254 },
		{ username: 'oscar india charlie', score: 929046 },
		{ username: 'golf sierra echo', score: 156317 },
		{ username: 'yankee', score: 755283 },
		{ username: 'zulu juliet', score: 554669 },
		{ username: 'hotel sierra', score: 318001 },
		{ username: 'charlie alpha', score: 176530 },
		{ username: 'golf sierra', score: 850081 },
		{ username: 'sierra romeo delta', score: 989190 },
		{ username: 'zulu', score: 53514 },
		{ username: 'alpha india', score: 67150 },
		{ username: 'charlie oscar', score: 594937 },
		{ username: 'lima golf', score: 897368 },
		{ username: 'kilo golf', score: 63959 },
		{ username: 'zulu uniform', score: 34036 },
		{ username: 'xray delta', score: 339968 },
		{ username: 'papa', score: 909081 },
		{ username: 'tango yankee victor', score: 827905 },
		{ username: 'delta', score: 974036 },
		{ username: 'sierra beta romeo', score: 839796 },
		{ username: 'zulu', score: 38441 },
		{ username: 'zulu zulu', score: 381153 },
		{ username: 'alpha oscar tango', score: 223565 },
		{ username: 'quebec', score: 464331 },
		{ username: 'juliet', score: 339783 },
		{ username: 'charlie', score: 459348 },
		{ username: 'foxtrot', score: 233679 },
		{ username: 'hotel echo', score: 151944 },
		{ username: 'papa oscar', score: 341146 },
		{ username: 'echo zulu', score: 614780 },
		{ username: 'november', score: 571368 },
		{ username: 'whiskey delta golf', score: 284343 },
		{ username: 'tango india delta', score: 533916 },
		{ username: 'foxtrot lima', score: 556929 },
		{ username: 'kilo quebec', score: 814142 },
		{ username: 'charlie charlie', score: 415485 },
		{ username: 'hotel foxtrot', score: 592729 },
		{ username: 'delta foxtrot yankee', score: 645763 },
		{ username: 'papa quebec kilo', score: 618369 },
		{ username: 'echo', score: 835583 },
		{ username: 'lima uniform', score: 622470 },
		{ username: 'alpha golf lima', score: 683268 },
		{ username: 'victor whiskey', score: 135605 },
		{ username: 'charlie india yankee', score: 269054 },
		{ username: 'uniform xray hotel', score: 193327 },
		{ username: 'november uniform mike', score: 977080 },
		{ username: 'romeo zulu hotel', score: 896774 },
		{ username: 'mike', score: 612602 },
		{ username: 'alpha', score: 219695 },
		{ username: 'delta kilo', score: 990622 },
		{ username: 'victor', score: 569798 },
		{ username: 'oscar xray', score: 520713 },
		{ username: 'romeo zulu mike', score: 421216 },
		{ username: 'juliet xray golf', score: 119986 },
		{ username: 'mike sierra', score: 404774 },
		{ username: 'november alpha', score: 102135 },
		{ username: 'xray', score: 477134 },
		{ username: 'charlie beta', score: 41808 },
		{ username: 'lima kilo', score: 607459 },
		{ username: 'sierra kilo', score: 716967 },
		{ username: 'xray', score: 211130 },
		{ username: 'tango', score: 406539 },
		{ username: 'alpha', score: 186724 },
		{ username: 'alpha quebec sierra', score: 623077 },
		{ username: 'romeo', score: 883577 },
		{ username: 'alpha', score: 744551 },
		{ username: 'beta', score: 495867 },
		{ username: 'quebec xray echo', score: 967648 },
		{ username: 'delta india golf', score: 864041 },
		{ username: 'xray delta', score: 758828 },
		{ username: 'juliet delta', score: 985465 },
		{ username: 'romeo', score: 485813 },
		{ username: 'alpha juliet', score: 145933 },
		{ username: 'oscar echo', score: 952281 },
		{ username: 'uniform', score: 500383 },
		{ username: 'kilo', score: 689371 },
		{ username: 'tango victor echo', score: 176083 },
		{ username: 'hotel golf hotel', score: 875239 },
		{ username: 'uniform beta uniform', score: 600730 },
		{ username: 'beta foxtrot', score: 125895 },
		{ username: 'victor romeo papa', score: 228607 },
		{ username: 'papa india', score: 719586 },
		{ username: 'papa sierra xray', score: 135401 },
		{ username: 'yankee xray victor', score: 518639 },
		{ username: 'hotel foxtrot', score: 642343 },
		{ username: 'hotel juliet oscar', score: 648504 },
		{ username: 'india juliet', score: 345112 },
		{ username: 'november sierra', score: 736491 },
		{ username: 'yankee xray romeo', score: 170623 },
		{ username: 'hotel', score: 7493 },
		{ username: 'quebec', score: 704747 },
		{ username: 'november', score: 957107 },
		{ username: 'xray oscar beta', score: 707795 },
		{ username: 'india kilo', score: 155549 },
		{ username: 'whiskey xray', score: 701036 },
		{ username: 'whiskey', score: 576333 },
		{ username: 'oscar lima yankee', score: 6450 },
		{ username: 'papa quebec', score: 697331 },
		{ username: 'india kilo romeo', score: 945217 },
		{ username: 'yankee yankee', score: 350679 },
		{ username: 'lima', score: 822630 },
		{ username: 'november', score: 18978 },
		{ username: 'victor lima', score: 144067 },
		{ username: 'papa romeo', score: 967893 },
		{ username: 'quebec', score: 150504 },
		{ username: 'oscar lima papa', score: 217920 },
		{ username: 'november charlie charlie', score: 252204 },
		{ username: 'victor charlie', score: 397231 },
		{ username: 'zulu tango', score: 34732 },
		{ username: 'mike', score: 346758 },
		{ username: 'papa mike', score: 598977 },
		{ username: 'mike oscar', score: 383472 },
		{ username: 'beta charlie uniform', score: 459310 },
		{ username: 'victor delta juliet', score: 206553 },
		{ username: 'tango', score: 660941 },
		{ username: 'papa', score: 44061 },
		{ username: 'victor', score: 523690 },
		{ username: 'mike juliet', score: 967975 },
		{ username: 'hotel tango', score: 952387 },
		{ username: 'yankee hotel mike', score: 551727 },
		{ username: 'mike', score: 36453 },
		{ username: 'november november xray', score: 478262 },
		{ username: 'whiskey hotel november', score: 988905 },
		{ username: 'delta', score: 933322 },
		{ username: 'mike romeo india', score: 475106 },
		{ username: 'uniform echo echo', score: 999007 },
		{ username: 'uniform', score: 30063 },
		{ username: 'tango mike', score: 990401 },
		{ username: 'romeo victor', score: 647981 },
		{ username: 'romeo golf oscar', score: 485581 },
		{ username: 'sierra', score: 546681 },
		{ username: 'xray', score: 852173 },
		{ username: 'tango', score: 391438 },
		{ username: 'whiskey romeo golf', score: 640117 },
		{ username: 'kilo quebec', score: 230199 },
		{ username: 'alpha', score: 648354 },
		{ username: 'alpha', score: 338366 },
		{ username: 'juliet zulu oscar', score: 879499 },
		{ username: 'zulu', score: 101040 },
		{ username: 'whiskey quebec juliet', score: 879923 },
		{ username: 'whiskey yankee juliet', score: 111837 },
		{ username: 'echo alpha india', score: 721897 },
		{ username: 'tango', score: 686259 },
		{ username: 'charlie', score: 749539 },
		{ username: 'whiskey foxtrot', score: 867883 },
		{ username: 'victor echo', score: 285204 },
		{ username: 'papa', score: 610140 },
	];

	users = users
		.sort((a, b) => b.score - a.score)
		.map((user, index) => ({
			...user,
			rank: index + 1,
		}));

	const sortedUsers = useMemo(() => {
		// Determine if searching by rank
		if (searchTerm.startsWith('#')) {
			const searchRank = searchTerm.slice(1); // Extract the numerical part of the search term
			if (searchRank) {
				// Filter users whose rank string representation includes the searchRank
				return users.filter((user) => user.rank.toString().includes(searchRank));
			}
			return users; // If no specific rank is provided (just '#'), show all users
		}

		// Original search logic for username search
		return users
			.sort((a, b) => (isDescending ? b.score - a.score : a.score - b.score))
			.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()));
	}, [users, isDescending, searchTerm]);

	const handleSearchChange = (e) => setSearchTerm(e.target.value);
	const toggleSortOrder = () => setIsDescending(!isDescending);

	const Row = ({ index, style }) => (
		<div
			style={style}
			className={`font-manga text-xl flex justify-between px-2 py-2 ${
				index % 2 ? 'bg-white/10' : 'bg-blue-300/10'
			}`}>
			<div className={`font-manga text-xl flex justify-between`}>
				<div className={`flex space-x-2 items-center`}>
					<div
						className={`font-manga text-lg text-white w-[30px] flex items-center justify-center`}>
						#{sortedUsers[index].rank}
					</div>
					<span className='text-white/10'>|</span>
					<div className='flex items-center space-x-2'>
						<FaUserCircle
							size={18}
							className={`text-white`}
						/>
						<span>{sortedUsers[index].username}</span>
					</div>
				</div>
			</div>

			<span>
				{sortedUsers[index].score} <span className='text-xs h-full'>PTS</span>
			</span>
		</div>
	);

	return (
		<div className={`w-full h-full flex flex-col`}>
			<div className={`flex w-full justify-between mb-10`}>
				<BackButton />
				<UserDisplay onClickEnabled={true} />
			</div>
			<div className='relative w-full h-full flex flex-col justify-center items-center overflow-hidden'>
				<div className='flex items-center h-fit space-x-4'>
					<FaTrophy
						size={32}
						className={`-translate-y-[0.15rem] text-yellow-500`}
					/>
					<h1 className={`text-5xl font-sunny text-center text-white`}>TOP 1000 LEADERBOARD</h1>
					<FaTrophy
						size={32}
						className={`-translate-y-[0.15rem] text-yellow-500`}
					/>
				</div>
				<div className='max-w-[800px] w-full flex flex-col justify-center p-4 items-center '>
					<div className='w-full h-fit flex flex-row p-2 rounded-sm items-center justify-center space-x-4'>
						<div
							className={`translate-y-[0.15rem] flex items-center h-full justify-center space-x-2 w-fit cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}
							onClick={() => setIsDescending(!isDescending)}>
							<IoFilter
								size={18}
								className={`text-white -translate-y-[0.15rem] transition-all duration-500 ease-in-out ${
									isDescending ? 'rotate-0' : 'rotate-180'
								}`}
							/>
							<span className={`h-full font-manga text-xl `}>
								{isDescending ? 'DESCENDING' : 'ASCENDING'}
							</span>
						</div>
						<span className={`text-white/10`}>|</span>
						<div className='flex space-x-2 items-center'>
							<FaSearch
								size={14}
								className={`text-white`}
							/>
							<input
								type='text'
								onChange={handleSearchChange}
								value={searchTerm}
								className={`font-manga text-xl rounded-md min-w-[80px] max-w-[140px] px-2 w-full bg-white/10 text-dark outline-none`}
							/>
						</div>
					</div>
					<List
						height={500}
						itemCount={sortedUsers.length}
						itemSize={45}
						width={'100%'}>
						{Row}
					</List>
				</div>
			</div>
		</div>
	);
}
