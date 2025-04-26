// src/components/WalletConnect.tsx
"use client"; // Necessary for hooks and window access

import React, { useState, useCallback } from 'react';
import type {
    DAppConnectorAPI,
    DAppConnectorWalletAPI,
    DAppConnectorWalletState,
    ServiceUriConfig,
    APIError
} from '@midnight-ntwrk/dapp-connector-api';

// Simple display component for key-value pairs
const InfoItem: React.FC<{ label: string; value: string | number | bigint | undefined | null }> = ({ label, value }) => (
    <p style={{ margin: '2px 0', fontSize: '0.9em' }}>
        <strong style={{ marginRight: '5px' }}>{label}:</strong>
        <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{String(value ?? 'N/A')}</span>
    </p>
);

export const WalletConnect: React.FC = () => {
    // State variables to manage connection status, data, and errors
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null); // For specific flow messages
    const [walletName, setWalletName] = useState<string | null>(null);
    const [walletState, setWalletState] = useState<DAppConnectorWalletState | null>(null);
    const [serviceUris, setServiceUris] = useState<ServiceUriConfig | null>(null);
    const [walletApi, setWalletApi] = useState<DAppConnectorWalletAPI | null>(null); // Store the API object

    const targetWalletName = 'mnLace'; // Hardcode for this test

    // Function to safely get the connector from the window object
    const getConnector = useCallback((): DAppConnectorAPI | null => {
        if (typeof window !== 'undefined' && window.midnight && window.midnight[targetWalletName]) {
            return window.midnight[targetWalletName];
        }
        console.warn(`Connector window.midnight.${targetWalletName} not found.`);
        return null;
    }, []); // No dependency on targetWalletName as it's hardcoded here

    // Function to handle the connection logic
    const handleConnect = useCallback(async () => {
        console.log("--- Connect Button Clicked ---");
        setIsLoading(true);
        setError(null);
        setInfoMessage(null);

        const connector = getConnector();

        if (!connector) {
            setError(`Wallet connector '${targetWalletName}' not found. Ensure the Midnight Lace Wallet extension is installed and enabled.`);
            setIsLoading(false);
            return;
        }

        console.log(`[1] Attempting connection via ${connector.name} (v${connector.apiVersion})...`);

        try {
            // Pre-check isEnabled - helps debug/diagnose
            const alreadyEnabled = await connector.isEnabled();
            console.log(`[2] Pre-check: connector.isEnabled() returned: ${alreadyEnabled}`);

            // Attempt to enable the wallet (triggers prompt if needed, returns API)
            console.log("[3] Calling connector.enable()...");
            const enabledApi = await connector.enable();
            console.log("[4] connector.enable() promise resolved successfully.");
            setWalletApi(enabledApi); // Store the API object
            // use walletApi to fetch state and URIs
            
            setWalletName(connector.name);

            // Fetch state and URIs *after* successful enable
            console.log("[5] Fetching wallet state and service URIs...");
            const [initialState, uris] = await Promise.all([
                enabledApi.state(),
                connector.serviceUriConfig() // Use the main connector for service URIs
            ]);
            console.log("[6] State and URIs fetched successfully.");

            // Update state to reflect connection
            setWalletState(initialState);
            setServiceUris(uris);
            setIsConnected(true);
            setError(null); // Clear any previous error/info
            setInfoMessage(null);

            console.log(`[7] Successfully connected! Address: ${initialState.address}`);
            console.log("[8] Service URIs:", uris);

        } catch (err) {
            console.error("[!] Connection Error:", err); // Log the raw error

            // --- Robust Error Handling ---
            const apiError = err as APIError;
            const errorWithCode = err as { code?: number };
            const code = errorWithCode?.code ?? apiError?.code;
            const errorWithInfo = err as { info?: string };
            const info = errorWithInfo?.info ?? apiError?.reason ?? (err as Error)?.message;
            const message = (err as Error)?.message || info || 'Unknown error';

            // --- Specific Handling for Code -3 ---
            if (code === -3 || String(message).includes('enable() first')) {
                console.warn("[!] Encountered Code -3 / 'enable() first' error.");
                setInfoMessage(`Connection prompt may have appeared in the ${connector?.name ?? targetWalletName} extension. Please approve it there, then click 'Connect Wallet' again.`);
                setError(null);
                // Reset potentially optimistic state updates from previous attempts if any
                setWalletApi(null);
                setServiceUris(null);
                setWalletState(null);
                setIsConnected(false);
                setWalletName(null);
            } else {
                // --- Handle Other Errors ---
                let detailedError = `Connection failed: ${message}`;
                if (code) {
                    detailedError += ` (Code: ${code})`;
                }
                setError(detailedError);
                setInfoMessage(null);
                // Clear connection state fully on other errors
                setWalletApi(null);
                setServiceUris(null);
                setWalletState(null);
                setIsConnected(false);
                setWalletName(null);
            }
        } finally {
            setIsLoading(false);
            console.log("--- Connection attempt finished ---");
        }
    }, [getConnector]); // Dependencies

    // Function to handle disconnection (clears local state)
    const handleDisconnect = useCallback(() => {
        console.log("--- Disconnect Button Clicked ---");
        setIsLoading(false);
        setIsConnected(false);
        setError(null);
        setInfoMessage(null);
        setWalletName(null);
        setWalletState(null);
        setServiceUris(null);
        setWalletApi(null);
        console.log("DApp state cleared.");
    }, []);

    return (
        <div style={{ border: '1px solid #555', padding: '15px', margin: '20px', borderRadius: '5px', backgroundColor: '#2a2a2a', color: '#eee' }}>
            <h3>Wallet Connection Test</h3>

            {/* Status Indicators */}
            {isLoading && <p style={{ color: '#60a5fa' }}>⏳ Connecting...</p>}
            {infoMessage && !isLoading && <p style={{ color: '#93c5fd', border: '1px dashed #93c5fd', padding: '5px' }}>ℹ️ {infoMessage}</p>}
            {error && !isLoading && <p style={{ color: '#f87171', border: '1px dashed #f87171', padding: '5px' }}>❌ Error: {error}</p>}

            {/* Connection Details (if connected) */}
            {isConnected && walletState && serviceUris ? (
                <div style={{ marginTop: '10px' }}>
                    <p style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ Status: Connected</p>
                    <InfoItem label="Wallet Name" value={walletName} />
                    <InfoItem label="Address (Bech32m)" value={walletState.address} />
                    <InfoItem label="Coin PK (Bech32m)" value={walletState.coinPublicKey} />
                    <InfoItem label="Encryption PK (Bech32m)" value={walletState.encryptionPublicKey} />
                    <details style={{ marginTop: '10px', fontSize: '0.9em' }}>
                        <summary>Service URIs</summary>
                        <div style={{ paddingLeft: '15px', borderLeft: '1px solid #444' }}>
                            <InfoItem label="Node" value={serviceUris.substrateNodeUri} />
                            <InfoItem label="Indexer (HTTP)" value={serviceUris.indexerUri} />
                            <InfoItem label="Indexer (WS)" value={serviceUris.indexerWsUri} />
                            <InfoItem label="Proof Server" value={serviceUris.proverServerUri} />
                        </div>
                    </details>
                     <details style={{ marginTop: '10px', fontSize: '0.9em' }}>
                        <summary>Legacy Keys (Hex)</summary>
                         <div style={{ paddingLeft: '15px', borderLeft: '1px solid #444' }}>
                            <InfoItem label="Address (Legacy)" value={walletState.addressLegacy} />
                            <InfoItem label="Coin PK (Legacy)" value={walletState.coinPublicKeyLegacy} />
                            <InfoItem label="Encryption PK (Legacy)" value={walletState.encryptionPublicKeyLegacy} />
                        </div>
                    </details>
                    <button
                        onClick={handleDisconnect}
                        style={{ marginTop: '15px', padding: '8px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Disconnect
                    </button>
                </div>
            ) : (
                // Show Connect button only if not loading and not showing the info message
                !isLoading && !infoMessage && (
                     <div>
                        <p style={{ color: '#facc15' }}>⚪ Status: Disconnected</p>
                        <button
                            onClick={handleConnect}
                            disabled={isLoading}
                            style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Connect Wallet ({targetWalletName})
                        </button>
                     </div>
                )
            )}
             {/* Show connect button even with info message, as user needs to click again */}
             {!isLoading && infoMessage && (
                 <button
                     onClick={handleConnect}
                     disabled={isLoading}
                     style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                 >
                     Connect Wallet ({targetWalletName})
                 </button>
             )}
        </div>
    );
};