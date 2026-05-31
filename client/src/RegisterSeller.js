import React, { Component } from 'react'
import LandContract from "./artifacts/Land.json"
import getWeb3 from "./getWeb3"
import fileUpload from './ipfs';
import * as govApi from './services/govApi';
import { getWalletAddress } from './services/authService';

class RegisterSeller extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            name: '',
            age: '',
            aadharNumber: '',
            panNumber: '',
            landsOwned: '',
            aadharVerified: false,
            panVerified: false,
            verificationId: '',
            govData: null,
            aadharResult: null,
            panResult: null,
            file2: null,
            documentHash: '',
            loading: false,
        }
        this.captureDoc = this.captureDoc.bind(this);
    }

    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = LandContract.networks[networkId];
            const instance = new web3.eth.Contract(
                LandContract.abi,
                deployedNetwork && deployedNetwork.address,
            );
            this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });
        } catch (error) {
            console.error(error);
        }
    };

    verifyAadhar = async () => {
        if (!this.state.aadharNumber.trim() || !this.state.name.trim()) {
            this.setState({ aadharResult: { reason: 'Enter Name and Aadhaar first' } });
            return;
        }
        if (!/^\d{12}$/.test(this.state.aadharNumber.trim())) {
            this.setState({ aadharResult: { reason: 'Aadhaar must be exactly 12 digits' } });
            return;
        }
        const result = await govApi.verifyAadhar(this.state.aadharNumber, this.state.name);
        this.setState({ aadharResult: result, aadharVerified: result.verified || false });
        if (result.verified && result.verificationId) {
            this.setState({ verificationId: result.verificationId, govData: result });
            if (result.walletAddress) {
                this.setState({ account: result.walletAddress });
            }
        }
    }

    verifyPAN = async () => {
        if (!this.state.panNumber.trim() || !this.state.name.trim()) {
            this.setState({ panResult: { reason: 'Enter Name and PAN first' } });
            return;
        }
        if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(this.state.panNumber.trim().toUpperCase())) {
            this.setState({ panResult: { reason: 'PAN must be in format ABCDE1234F' } });
            return;
        }
        const result = await govApi.verifyPAN(this.state.panNumber, this.state.name);
        this.setState({ panResult: result, panVerified: result.verified || false });
    }

    addDoc = async () => {
        if (!this.state.file2) return;
        try {
            const result = await fileUpload.upload(this.state.file2);
            this.setState({ documentHash: result.fileId || '' });
        } catch (e) {
            console.error('File upload failed:', e.message);
            this.setState({ documentHash: '' });
        }
    }

    registerSeller = async () => {
        this.setState({ loading: true });
        await this.addDoc();
        if (this.state.name === '' || this.state.age === '' || this.state.landsOwned === '') {
            this.setState({ loading: false });
            this.setState({ aadharResult: { reason: 'All fields are compulsory!' } });
        } else if (!this.state.aadharVerified || !this.state.panVerified) {
            this.setState({ loading: false });
            this.setState({ aadharResult: { reason: 'Complete Aadhaar and PAN verification first!' } });
        } else if (!Number(this.state.age) || this.state.age < 21) {
            this.setState({ loading: false });
            this.setState({ aadharResult: { reason: 'Age must be a number and at least 21' } });
        } else {
            try {
                const alreadyRegistered = await this.state.LandInstance.methods.isRegistered(this.state.account).call();
                if (alreadyRegistered) {
                    this.setState({ loading: false, aadharResult: { reason: 'This account is already registered. Please sign in instead.' } });
                    return;
                }
                await this.state.LandInstance.methods.registerSeller(
                    this.state.name,
                    this.state.age,
                    this.state.landsOwned,
                    this.state.verificationId,
                    this.state.documentHash)
                    .send({
                        from: this.state.account,
                        gas: 2100000
                    });
                window.location.href = "/";
            } catch (e) {
                console.error(e);
                this.setState({ loading: false, aadharResult: { reason: 'Registration failed: ' + (e.message || 'Check console') } });
            }
        }
    }

    captureDoc(event) {
        event.preventDefault()
        const file2 = event.target.files[0]
        if (file2) this.setState({ file2 })
    }

    render() {
        const { aadharVerified, panVerified, aadharResult, panResult, loading } = this.state;

        const inputStyle = {
            width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0',
            fontSize: 14, outline: 'none', marginBottom: 4, boxSizing: 'border-box',
        };
        const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 };
        const btnSmall = (onClick, label, color) => (
            <button onClick={onClick} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: color || '#1a5276', color: '#fff', border: 'none', cursor: 'pointer', marginTop: 4,
            }}>{label}</button>
        );
        const badge = (ok, msg) => (
            <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 8, color: ok ? '#166534' : '#991b1b' }}>
                {ok ? '✓ Verified' : msg || ''}
            </span>
        );

        return (
            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
                {/* Left panel */}
                <div style={{
                    flex: '0 0 42%', background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #FF9933 33%, #fff 33%, #fff 66%, #138808 66%)' }} />
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
                            border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 24px', fontSize: 32,
                        }}>🏛️</div>
                        <div style={{ color: '#FF9933', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
                            Government of India
                        </div>
                        <h1 style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, lineHeight: 1.2, margin: '0 0 12px' }}>
                            Seller Registration
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: '0 0 30px' }}>
                            Register as a property seller on the Digital Land Registry platform.
                        </p>
                        {[
                            { icon: '🔒', text: 'Aadhaar & PAN verified identity' },
                            { icon: '📄', text: 'Upload identity documents securely' },
                            { icon: '⛓️', text: 'Blockchain-backed registration' },
                        ].map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, textAlign: 'left' }}>
                                <span style={{ fontSize: 18 }}>{f.icon}</span>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right panel — form */}
                <div style={{
                    flex: 1, background: '#f7f8fc', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', padding: '32px 24px',
                    overflowY: 'auto',
                }}>
                    <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Create Seller Account</h2>
                        <p style={{ margin: '0 0 24px', color: '#999', fontSize: 13 }}>Fill in your details and verify your identity</p>

                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Full Name</label>
                            <input style={inputStyle} placeholder="Enter full name" value={this.state.name} onChange={e => this.setState({ name: e.target.value })} />
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Age</label>
                                <input style={inputStyle} placeholder="Age" type="number" min="21" value={this.state.age} onChange={e => this.setState({ age: e.target.value })} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Owned Lands</label>
                                <input style={inputStyle} placeholder="Number" value={this.state.landsOwned} onChange={e => this.setState({ landsOwned: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Aadhaar Number {aadharResult && badge(aadharVerified, aadharResult.reason)}</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input style={{ ...inputStyle, flex: 1 }} placeholder="12-digit Aadhaar" value={this.state.aadharNumber} onChange={e => this.setState({ aadharNumber: e.target.value })} />
                                {btnSmall(this.verifyAadhar, 'Verify', aadharVerified ? '#166534' : '#1a5276')}
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>PAN Number {panResult && badge(panVerified, panResult.reason)}</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input style={{ ...inputStyle, flex: 1 }} placeholder="ABCDE1234F" value={this.state.panNumber} onChange={e => this.setState({ panNumber: e.target.value })} />
                                {btnSmall(this.verifyPAN, 'Verify', panVerified ? '#166534' : '#1a5276')}
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Identity Document (PDF)</label>
                            <input type="file" accept=".pdf,.jpg,.png" onChange={this.captureDoc} style={{ fontSize: 13 }} />
                        </div>

                        <button
                            onClick={this.registerSeller}
                            disabled={!aadharVerified || !panVerified || loading}
                            style={{
                                width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                                background: (!aadharVerified || !panVerified || loading) ? '#aaa' : '#1a5276',
                                color: '#fff', border: 'none', cursor: (!aadharVerified || !panVerified || loading) ? 'not-allowed' : 'pointer',
                                marginBottom: 16,
                            }}
                        >
                            {loading ? 'Registering...' : 'Register on Blockchain →'}
                        </button>

                        <div style={{ textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
                            <span style={{ color: '#999', fontSize: 12 }}>Already registered? </span>
                            <a href="/" style={{ color: '#1a5276', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Sign In</a>
                            <span style={{ color: '#ccc', margin: '0 8px' }}>|</span>
                            <a href="/RegisterBuyer" style={{ color: '#1a5276', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Register as Buyer</a>
                        </div>
                    </div>
                    <div style={{ marginTop: 20, color: '#bbb', fontSize: 11 }}>Digital Land Registry System · Built on Ethereum Blockchain</div>
                </div>
            </div>
        );
    }
}

export default RegisterSeller;
