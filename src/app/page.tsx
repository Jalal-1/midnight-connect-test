// src/app/page.tsx
import { WalletConnect } from "@/components/WalletConnect"; // Adjust path if needed

export default function Home() {
  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#1e1e1e', color: '#ccc', minHeight: '100vh' }}>
      <h1>Midnight Wallet Connection Test</h1>
      <p>This page isolates the wallet connection logic using the DApp Connector API.</p>
      <p>Open your browsers developer console (F12) to see detailed logs during the connection attempt.</p>

      <WalletConnect />

      <h2>Instructions:</h2>
      <ol style={{ lineHeight: '1.6' }}>
        <li>Ensure the Midnight Lace Wallet extension (v1.2.1 or the version youre testing) is installed and unlocked in your browser.</li>
        <li>Ensure the extension is configured with the correct Network and Proof Server address (e.g., `http://127.0.0.1:6300` if running locally).</li>
        <li>Open the browsers developer console (F12).</li>
        <li>Click the Connect Wallet button above.</li>
        <li>Observe the console logs and the UI messages.</li>
        <li>If the wallet prompt appears, interact with it (Authorize/Cancel).</li>
        <li>If you see the info message about approving and clicking again, follow those instructions.</li>
        <li>Report the sequence of console logs and UI changes observed.</li>
      </ol>
    </main>
  );
}