'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/userAuthContext.js';
import { useRouter } from 'next/navigation';
import { FaSearch, FaUserCircle } from 'react-icons/fa';
import { IoFilter } from 'react-icons/io5';
import { FixedSizeList as List } from 'react-window';
import { FaCrown, FaMedal, FaTrophy } from 'react-icons/fa6';
import TopBar from '../components/login/topBar.js';
import AutoSizer from 'react-virtualized-auto-sizer';

export default function LeaderboardPage() {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState('');
	const { currentUser } = useAuth();
	const [isDescending, setIsDescending] = useState(true);
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

	const containerRef = useRef(null);

	// Adjust fetchUsers to manage loading state:
	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true); // Set loading to true when fetch starts
			const response = await fetch('/api/leaderboard', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			const data = await response.json();
			if (data.success) {
				setUsers(
					data.data.map((user, index) => ({
						...user,
						rank: index + 1,
					}))
				);
			} else {
				console.error('Failed to fetch leaderboard:', data.error);
			}
			setLoading(false); // Set loading to false when fetch completes
		};

		fetchUsers();
	}, []);

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
			className={`relative w-full font-manga flex flex-col rounded-md sm:flex-row justify-between xs:items-center px-4 py-2 space-x-4 ${
				index % 2 ? 'bg-dark' : 'bg-darkAccent'
			}`}>
			<div className={`font-manga flex w-full justify-between`}>
				<div className={`flex items-center text-start space-x-2`}>
					<div className={`flex space-x-2`}>
						<div
							className={`font-manga text-2xl md:text-3xl text-white w-fit flex items-center justify-center`}>
							#{sortedUsers[index].rank}
						</div>
					</div>
					<span className='text-white/10 scale-[175%]'>|</span>
					<div className='flex items-center space-x-2 text-2xl md:text-3xl'>
						{/* <FaUserCircle
							size={24}
							className={`text-white`}
						/> */}
						<span> {sortedUsers[index].username}</span>
					</div>
				</div>
			</div>

			<div className='flex whitespace-nowrap w-full justify-end items-center pr-2 sm:pr-0'>
				{/* Conditionally render icons based on rank */}
				<div className={`px-2`}>
					{sortedUsers[index].rank === 1 ? (
						<FaTrophy
							size={32}
							className='text-yellow-300 -translate-y-1 mr-2'
						/>
					) : sortedUsers[index].rank === 2 ? (
						<FaMedal
							size={32}
							className='text-slate-300 -translate-y-1 mr-2'
						/>
					) : sortedUsers[index].rank === 3 ? (
						<FaMedal
							size={32}
							className='text-yellow-700 -translate-y-1 mr-2'
						/>
					) : null}
				</div>
				{/* Score Display */}
				<span className='text-2xl md:text-3xl text-end'>
					{sortedUsers[index].score} <span className='text-lg md:text-xl'>PTS</span>
				</span>
			</div>
		</div>
	);

	return (
		<div className={`w-full h-full flex flex-col`}>
			<TopBar
				userOnClickEnabled={true}
				backButtonGoHome={false}
				showProfileIfNotLoggedIn={true}
			/>
			<div className='relative w-full h-full flex flex-col items-center'>
				<div className='flex items-center space-x-4'>
					<h1
						data-text='TOP 1000 LEADERBOARD'
						className={`leading-none text-[3rem] md:text-[6rem] lg:text-[7rem] font-sunny text-center text-white`}>
						TOP{' '}
						<span className={`relative`}>
							1000
							<FaCrown
								className={`text-stroke absolute text-yellow-300 hover:scale-110 hover:rotate-[15deg] transition-all duration-300 -top-8 -right-5 lg:-top-11 lg:-right-4 drop-shadow-md rotate-[20deg] w-[42px] h-[42px] lg:w-[64px] lg:h-[64px]`}
							/>
						</span>{' '}
						LEADERBOARD
					</h1>
				</div>
				<div className='relative max-w-[600px] w-full h-full flex flex-col items-center '>
					<div className='w-full h-fit flex flex-row p-2 rounded-sm items-center justify-center space-x-4'>
						<div
							className={`translate-y-[0.15rem] flex items-center h-full justify-center space-x-2 w-fit cursor-pointer sm:hover:opacity-50 sm:active:scale-95`}
							onClick={() => setIsDescending(!isDescending)}>
							<div className={`bg-dark p-1 rounded-full text-white -translate-y-[0.25rem] `}>
								<IoFilter
									size={18}
									className={`transition-all duration-500 ease-in-out ${
										isDescending ? 'rotate-0' : 'rotate-180'
									}`}
								/>
							</div>

							<h1
								data-text={isDescending ? 'DESCENDING' : 'ASCENDING'}
								className={`h-full font-manga text-2xl lg:text-3xl `}>
								{isDescending ? 'DESCENDING' : 'ASCENDING'}
							</h1>
						</div>
						<span className={`text-darkAccent`}>|</span>
						<div className='flex space-x-2 items-center'>
							<div className={`bg-dark p-2 rounded-full text-white`}>
								<FaSearch size={14} />
							</div>
							<input
								type='text'
								onChange={handleSearchChange}
								value={searchTerm}
								className={`font-manga text-3xl rounded-md max-h-[30px] min-w-[80px] max-w-[140px] px-2 w-full bg-darkAccent outline outline-4 outline-dark text-white `}
							/>
						</div>
					</div>
					<div
						className={`w-full h-full max-h-[800px] bg-dark p-4 rounded-md outline outline-2 outline-darkAccent`}>
						<div
							ref={containerRef}
							className={`w-full h-full`}>
							{loading ? (
								<div className={`bg-dark rounded-md w-full flex justify-center`}>
									<h1
										className={`w-fit h-fit z-20 mt-8 font-sunny text-white text-2xl lg:text-5xl`}>
										LOADING...
									</h1>
								</div>
							) : sortedUsers.length >= 1 ? (
								<AutoSizer>
									{({ height, width }) => (
										<List
											className={``}
											type='responsive'
											height={height}
											width={width}
											itemCount={sortedUsers.length}
											itemSize={84}>
											{Row}
										</List>
									)}
								</AutoSizer>
							) : (
								<div
									className={`bg-dark rounded-md w-full flex justify-center`}
									style={{ height: '90%' }}>
									<h1
										className={`w-fit h-fit z-20 mt-8 font-sunny text-red-300 text-2xl lg:text-5xl`}>
										NO MATCHING USER ENTRIES!
									</h1>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
