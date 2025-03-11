import React from 'react';
import {useAccount,useConnect, useDisconnect} from 'wagmi';

const WalletConnect = () => {
    const {isConnected, address} = useAccount();
    const {connect, connectors} = useConnect();
    const {disconnect} = useDisconnect();

    return (
        <div>
            {isConnected ? (
                <div>
                    <p>
                        Connected as {address}
                    </p>
                    <button onClick={() => disconnect}>
                        Disconnect Wallet
                        </button>
                </div>
            ) : (
                    <button onClick={() => connect({ connector: connectors[0]})}>
                        Connect Wallet
                    </button>
            )}
        </div>
    );
};

export default WalletConnect;