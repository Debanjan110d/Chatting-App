import { WebSocket } from "ws";
import { SignalData } from "@shared/schema";

// User ID -> WebSocket connection mapping
interface ConnectedClient {
  userId: string;
  socket: WebSocket;
  email: string;
}

/**
 * Handle WebRTC signaling messages between peers
 */
export function handleWebRTCSignaling(
  signalData: SignalData,
  connectedClients: Map<string, ConnectedClient>
): void {
  const targetClient = connectedClients.get(signalData.to as string);
  
  // Forward the signal to the target peer if they're connected
  if (targetClient && targetClient.socket.readyState === WebSocket.OPEN) {
    targetClient.socket.send(JSON.stringify({
      type: 'signal',
      signalType: signalData.type,
      from: signalData.from as string,
      payload: signalData.payload
    }));
  }
}
