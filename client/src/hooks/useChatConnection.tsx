import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '@/lib/config';
import { User } from '@/lib/types';
import { useWebRTC } from './useWebRTC';

interface ConnectedClient {
  userId: string;
  email: string;
  name: string;
}

export function useChatConnection(user: User | null) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [connectedClients, setConnectedClients] = useState<ConnectedClient[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const { setupPeerConnection, handleSignalingData } = useWebRTC();

  // Connect to WebSocket server
  const connectWebSocket = useCallback(() => {
    if (!user) return;
    
    setConnectionStatus('connecting');
    
    const wsUrl = WS_URL;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        // Authenticate user
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'auth',
            userId: user.id
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'auth-success') {
            setConnectionStatus('connected');
          } else if (data.type === 'clients') {
            setConnectedClients(data.clients);
          } else if (data.type === 'signal') {
            // Handle WebRTC signaling
            handleSignalingData({
              type: data.signalType,
              from: data.from,
              to: user.id,
              payload: data.payload
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        socketRef.current = null;
        
        // Attempt to reconnect after delay
        setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('disconnected');
      
      // Attempt to reconnect after delay
      setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  }, [user, handleSignalingData]);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnectionStatus('disconnected');
      return;
    }

    // Initial connection
    if (!socketRef.current) {
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user, connectWebSocket]);

  // Function to send signaling data
  const sendSignalingData = useCallback((to: number, signalType: 'offer' | 'answer' | 'ice-candidate', payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'signal',
        signalType,
        to,
        payload
      }));
    }
  }, []);

  return {
    connectionStatus,
    connectedClients,
    sendSignalingData,
    setupPeerConnection,
    socketRef,
  };
}
