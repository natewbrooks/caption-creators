import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [userToken, setUserToken] = useState('');

	useEffect(() => {
		if (typeof window !== 'undefined') {
			let token = sessionStorage.getItem('userToken'); // Use sessionStorage to keep data through page refreshes, but if the tab closes we lose the session.
			if (!token) {
				token = uuidv4(); // Generate UUID for userToken
				sessionStorage.setItem('userToken', token);
			}
			setUserToken(token);

			const newSocket = io('http://localhost:3000', {
				// Connect the users websocket to our development server
				query: { token: token },
				forceNew: true,
			});

			newSocket.on('connect', () => {
				console.log(`Connected with SOCKET ID: ${newSocket.id}`); // Socket ID can't be persistent through reload, hence why we keep track of userToken.
				console.log(`Connected with USER TOKEN: ${token}`);
			});

			setSocket(newSocket);

			return () => newSocket.close();
		}
	}, []);

	return <SocketContext.Provider value={{ socket, userToken }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
