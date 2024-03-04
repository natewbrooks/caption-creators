import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

let socket;
let userToken;

export const initializeSocket = () => {
	if (typeof window !== 'undefined') {
		userToken = sessionStorage.getItem('userToken'); // Use sessionStorage to keep data through page refreshes, but if the tab closes we lose the session.
		if (!userToken) {
			userToken = uuidv4(); // Generate UUID for userToken
			sessionStorage.setItem('userToken', userToken);
		}
		if (!socket) {
			socket = io('http://localhost:3000', {
				// Connect the users websocket to our development server
				query: { token: userToken },
				forceNew: true,
			});

			socket.on('connect', () => {
				console.log(`Connected with SOCKET ID: ${socket.id}`); // Socket ID can't be persistent through reload, hence why we keep track of userToken.
				console.log(`Connected with USER TOKEN: ${userToken}`);
			});
		}
	}

	return { socket, userToken };
};

// Export functions for easy access to the active users websocket
export const getSocket = () => {
	if (!socket) {
		initializeSocket();
	}
	return socket;
};

export const getUserToken = () => {
	if (!userToken) {
		initializeSocket();
	}
	return userToken;
};
