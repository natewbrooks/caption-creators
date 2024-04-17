'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/userAuthContext.js';
import { useRouter } from 'next/navigation';
import { FaSearch, FaUserCircle } from 'react-icons/fa';
import { IoFilter } from 'react-icons/io5';
import { FixedSizeList as List } from 'react-window';
import { FaCrown, FaMedal, FaTrophy } from 'react-icons/fa6';
import TopBar from '../components/login/topBar.js';

export default function LeaderboardPage() {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState('');
	const { currentUser } = useAuth();
	const [isDescending, setIsDescending] = useState(true);
	const [users, setUsers] = useState([]); // State to hold user data

	useEffect(() => {
		const fetchUsers = async () => {
			const response = await fetch('/api/leaderboard', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			const data = await response.json();
			if (data.success) {
				setUsers(
					data.data.map((user, index) => ({
						...user,
						rank: index + 1, // Assign rank as data is assumed to be pre-sorted from the API
					}))
				);
			} else {
				console.error('Failed to fetch leaderboard:', data.error);
			}
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
			className={`font-manga text-xl flex justify-between px-2 py-2 ${
				index % 2 ? 'bg-dark' : 'bg-darkAccent'
			}`}>
			<div className={`font-manga text-xl flex justify-between`}>
				<div className={`flex space-x-2 items-center`}>
					<div className={`flex space-x-2`}>
						<div
							className={`font-manga text-lg text-white w-[30px] flex items-center justify-center`}>
							#{sortedUsers[index].rank}
						</div>
						{sortedUsers[index].rank === 1 ? (
							<FaCrown
								size={24}
								className={`text-yellow-500`}
							/>
						) : sortedUsers[index].rank === 2 ? (
							<FaMedal
								size={24}
								className={`text-slate-300`}
							/>
						) : sortedUsers[index].rank === 3 ? (
							<FaMedal
								size={24}
								className={`text-yellow-700`}
							/>
						) : (
							''
						)}
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
			<TopBar
				userOnClickEnabled={true}
				backButtonGoHome={false}
				showProfileIfNotLoggedIn={true}
			/>
			<div className='relative w-full h-full flex flex-col items-center overflow-hidden'>
				<div className='flex items-center space-x-4'>
					<div className='w-fit h-fit -translate-y-[0.15rem] bg-dark rounded-md p-1'>
						<FaTrophy
							size={32}
							className={` text-yellow-500`}
						/>
					</div>
					<h1
						data-text='TOP 1000 LEADERBOARD'
						className={`text-6xl md:text-7xl font-sunny text-center text-white`}>
						TOP 1000 LEADERBOARD
					</h1>
					<div className='w-fit h-fit -translate-y-[0.15rem] bg-dark rounded-md p-1'>
						<FaTrophy
							size={32}
							className={` text-yellow-500`}
						/>
					</div>
				</div>
				<div className='relative max-w-[800px] w-full flex flex-col p-4 items-center '>
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
							<h1
								data-text={isDescending ? 'DESCENDING' : 'ASCENDING'}
								className={`h-full font-manga text-xl `}>
								{isDescending ? 'DESCENDING' : 'ASCENDING'}
							</h1>
						</div>
						<span className={`text-darkAccent`}>|</span>
						<div className='flex space-x-2 items-center'>
							<FaSearch
								size={14}
								className={`text-white`}
							/>
							<input
								type='text'
								onChange={handleSearchChange}
								value={searchTerm}
								className={`font-manga text-xl rounded-md min-w-[80px] max-w-[140px] px-2 w-full bg-darkAccent text-white outline-none`}
							/>
						</div>
					</div>
					<List
						className={`${
							sortedUsers.length === 0 ? '' : 'outline'
						} outline-2 outline-darkAccent bg-darkAccent rounded-md`}
						height={500}
						itemCount={sortedUsers.length}
						itemSize={45}
						width={'100%'}>
						{Row}
					</List>
					{sortedUsers.length === 0 && (
						<h1
							data-text='NO MATCHING RESULTS!'
							className={`absolute z-20 top-20 mt-4 font-sunny text-red-300 text-2xl`}>
							NO MATCHING RESULTS!
						</h1>
					)}
				</div>
			</div>
		</div>
	);
}
