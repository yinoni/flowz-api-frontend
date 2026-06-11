"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import { WS_URL } from "../utils/consts";

// הגדרת הטיפוס של הקונטקסט
interface WebSocketContextType {
  stompClient: Client | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  stompClient: null,
  isConnected: false,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL, // האנדפוינט הנקי שלך בשרת
      onConnect: () => {
        setIsConnected(true);
        console.log("Global WebSocket Connected!");
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log("Global WebSocket Disconnected!");
      },
    });

    client.activate();
    setStompClient(client);

    // ניקוי החיבור כשהאפליקציה נסגרת לחלוטין
    return () => {
      if (client.active) client.deactivate();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ stompClient, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom Hook כדי שיהיה קל לשלוף את החיבור בכל קומפוננטה
export const useWebSocket = () => useContext(WebSocketContext);