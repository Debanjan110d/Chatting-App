import { useRef, useCallback } from 'react';
import { SignalData } from '@/lib/types';
import SimplePeer from 'simple-peer';

export function useWebRTC() {
  // Map to store peer connections by user ID
  const peerConnections = useRef<Map<string, SimplePeer.Instance>>(new Map());

  // Setup a new peer connection with a remote user
  const setupPeerConnection = useCallback((
    remotePeerId: string, 
    isInitiator: boolean,
    onData: (data: any) => void,
    onSignal: (signalData: any) => void
  ) => {
    // Close existing connection if any
    if (peerConnections.current.has(remotePeerId)) {
      peerConnections.current.get(remotePeerId)?.destroy();
      peerConnections.current.delete(remotePeerId);
    }

    // Create new peer connection
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: true
    });

    // Handle signaling
    peer.on('signal', (data) => {
      onSignal(data);
    });

    // Handle data
    peer.on('data', (data) => {
      try {
        const parsedData = JSON.parse(data.toString());
        onData(parsedData);
      } catch (error) {
        console.error('Error parsing peer data:', error);
      }
    });

    // Handle errors
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      peerConnections.current.delete(remotePeerId);
    });

    // Store the peer connection
    peerConnections.current.set(remotePeerId, peer);

    return peer;
  }, []);

  // Handle signaling data received from the server
  const handleSignalingData = useCallback((signalData: SignalData) => {
    const { from, type, payload } = signalData;
    
    let peer = peerConnections.current.get(from);
    
    // If we received an offer but don't have a peer connection yet, create one
    if (type === 'offer' && !peer) {
      peer = setupPeerConnection(
        from,
        false,
        (data) => console.log('Received data from peer:', data),
        (signalData) => {
          // Here we would send an answer back through the signaling server
          console.log('Generated answer signal:', signalData);
        }
      );
    }

    // Apply the signaling data to the peer connection
    if (peer) {
      peer.signal(payload);
    }
  }, [setupPeerConnection]);

  // Send data to a peer
  const sendToPeer = useCallback((peerId: number, data: any) => {
    const peer = peerConnections.current.get(peerId);
    if (peer && peer.connected) {
      peer.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // Close a specific peer connection
  const closePeerConnection = useCallback((peerId: number) => {
    const peer = peerConnections.current.get(peerId);
    if (peer) {
      peer.destroy();
      peerConnections.current.delete(peerId);
    }
  }, []);

  // Close all peer connections
  const closeAllConnections = useCallback(() => {
    peerConnections.current.forEach((peer) => {
      peer.destroy();
    });
    peerConnections.current.clear();
  }, []);

  return {
    setupPeerConnection,
    handleSignalingData,
    sendToPeer,
    closePeerConnection,
    closeAllConnections
  };
}
