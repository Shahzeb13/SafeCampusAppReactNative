import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.33:4000'; // Match backend IP for physical device testing

let socket: Socket;

export const socketMessaging = {
  /**
   * Connect to the socket server
   */
  connect: (userId: string) => {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to Socket Server');
      socket.emit('join', userId);
    });

    return socket;
  },

  /**
   * Send a message to a specific receiver (Admin)
   */
  sendMessage: (senderId: string, senderName: string, receiverId: string, message: string) => {
    if (socket) {
      socket.emit('send_message', {
        senderId,
        senderName,
        receiverId,
        message,
      });
    }
  },

  /**
   * Listen for incoming messages
   */
  onMessageReceived: (callback: (data: any) => void) => {
    if (socket) {
      socket.on('receive_message', callback);
    }
  },

  /**
   * Disconnect from the socket server
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect();
    }
  },
};
