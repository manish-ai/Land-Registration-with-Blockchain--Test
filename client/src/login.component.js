import React, { Component } from 'react';
import { sendOtp, verifyOtp, isLoggedIn, getRole } from './services/authService';

export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 1,
            idType: 'aadhar',
            identifier: '',
            otp: '',
            citizenName: '',
            maskedPhone: '',
            loading: false,
            error: '',
        };
    }

    componentDidMount() {
        if (isLoggedIn()) {
            this.redirectByRole(getRole());
        }
    }

    redirectByRole(role) {
        if (role === 'inspector') window.location.href = '/admin/dashboard';
        else if (role === 'seller') window.location.href = '/seller/dashboard';
        else if (role === 'buyer') window.location.href = '/buyer/dashboard';
        else window.location.href = '/';
    }

    handleSendOtp = async () => {
        const { identifier, idType } = this.state;
        if (!identifier.trim()) {
            this.setState({ error: `Please enter your ${idType === 'aadhar' ? 'Aadhar' : 'PAN'} number` });
            return;
        }
        this.setState({ loading: true, error: '' });
        const result = await sendOtp(identifier.trim(), idType);
        this.setState({ loading: false });
        if (result.error) {
            this.setState({ error: result.error });
        } else if (result.success) {
            this.setState({ step: 2, citizenName: result.name, maskedPhone: result.message });
        } else {
            this.setState({ error: result.error || 'Identity not found in government records.' });
        }
    };

    handleVerifyOtp = async () => {
        const { identifier, idType, otp } = this.state;
        if (!otp.trim()) {
            this.setState({ error: 'Please enter the OTP' });
            return;
        }
        this.setState({ loading: true, error: '' });
        const result = await verifyOtp(identifier.trim(), idType, otp.trim());
        this.setState({ loading: false });
        if (result.success) {
            this.redirectByRole(result.role);
        } else {
            this.setState({ error: result.error || 'Invalid OTP. Please try again.' });
        }
    };

    render() {
        const { step, idType, identifier, otp, citizenName, maskedPhone, loading, error } = this.state;

        return (
            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Fira Sans', sans-serif" }}>
                {/* Left panel — branding */}
                <div style={{
                    flex: '0 0 45%',
                    background: 'linear-gradient(160deg, #0d1b2a 0%, #1b3a5c 50%, #1a5276 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '48px 40px',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* India flag top stripe */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #FF9933 33%, #fff 33%, #fff 66%, #138808 66%)' }} />

                    {/* Decorative circle */}
                    <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
                        {/* Government emblem placeholder */}
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.12)',
                            border: '2px solid rgba(255,255,255,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                            fontSize: 32,
                        }}>
                            🏛️
                        </div>

                        <div style={{ color: '#FF9933', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
                            Government of India
                        </div>

                        <h1 style={{ color: '#ffffff', fontSize: 32, fontWeight: 700, lineHeight: 1.2, margin: '0 0 12px' }}>
                            Digital Land Registry
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: '0 0 40px' }}>
                            A secure, transparent, blockchain-powered platform for land ownership registration and transfer.
                        </p>

                        {/* Feature list */}
                        {[
                            { icon: '🔒', text: 'Aadhaar & PAN verified identity' },
                            { icon: '⛓️', text: 'Immutable blockchain ownership records' },
                            { icon: '📋', text: 'Full audit trail on all transactions' },
                        ].map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, textAlign: 'left' }}>
                                <span style={{ fontSize: 18 }}>{f.icon}</span>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right panel — login form */}
                <div style={{
                    flex: 1,
                    background: '#f7f8fc',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '48px 32px',
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: 400,
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: '40px 36px',
                        boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
                    }}>
                        <h2 style={{ color: '#1a1a2e', fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
                            {step === 1 ? 'Sign In' : 'Verify OTP'}
                        </h2>
                        <p style={{ color: '#888', fontSize: 13, marginBottom: 28 }}>
                            {step === 1 ? 'Use your Aadhaar or PAN to continue' : `OTP sent to ${maskedPhone}`}
                        </p>

                        {step === 1 && (
                            <>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                        Login with
                                    </label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {['aadhar', 'pan'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => this.setState({ idType: type, error: '' })}
                                                style={{
                                                    flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                    border: idType === type ? '2px solid #1a5276' : '2px solid #e0e0e0',
                                                    background: idType === type ? '#1a5276' : '#fff',
                                                    color: idType === type ? '#fff' : '#555',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {type === 'aadhar' ? 'Aadhaar' : 'PAN'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                        {idType === 'aadhar' ? 'Aadhaar Number' : 'PAN Number'}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={idType === 'aadhar' ? '12-digit Aadhaar number' : 'e.g. ABCDE1234F'}
                                        value={identifier}
                                        onChange={e => this.setState({ identifier: e.target.value, error: '' })}
                                        onKeyDown={e => e.key === 'Enter' && this.handleSendOtp()}
                                        style={{
                                            width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14,
                                            border: '1.5px solid #e0e0e0', outline: 'none', boxSizing: 'border-box',
                                            fontFamily: 'inherit', color: '#1a1a2e',
                                        }}
                                    />
                                </div>

                                {error && (
                                    <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fff0f0', border: '1px solid #ffcccc', color: '#c0392b', fontSize: 13, marginBottom: 16 }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={this.handleSendOtp}
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                                        background: loading ? '#aaa' : '#1a5276', color: '#fff', border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 20, letterSpacing: 0.3,
                                    }}
                                >
                                    {loading ? 'Verifying...' : 'Send OTP →'}
                                </button>

                                <div style={{ textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                                    <span style={{ color: '#999', fontSize: 12 }}>New to the platform? </span>
                                    <a href="/RegisterBuyer" style={{ color: '#1a5276', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Register as Buyer</a>
                                    <span style={{ color: '#ccc', margin: '0 8px' }}>|</span>
                                    <a href="/RegisterSeller" style={{ color: '#1a5276', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Register as Seller</a>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div style={{
                                    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                                    padding: '14px 16px', marginBottom: 20,
                                }}>
                                    <p style={{ margin: 0, color: '#166534', fontWeight: 700, fontSize: 15 }}>
                                        Welcome, {citizenName}
                                    </p>
                                    <p style={{ margin: '4px 0 0', color: '#15803d', fontSize: 13 }}>
                                        Demo OTP: <strong>1234</strong>
                                    </p>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="4-digit OTP"
                                        value={otp}
                                        maxLength={6}
                                        onChange={e => this.setState({ otp: e.target.value, error: '' })}
                                        onKeyDown={e => e.key === 'Enter' && this.handleVerifyOtp()}
                                        autoFocus
                                        style={{
                                            width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 20,
                                            border: '1.5px solid #e0e0e0', outline: 'none', boxSizing: 'border-box',
                                            letterSpacing: 8, textAlign: 'center', fontFamily: 'monospace', color: '#1a1a2e',
                                        }}
                                    />
                                </div>

                                {error && (
                                    <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fff0f0', border: '1px solid #ffcccc', color: '#c0392b', fontSize: 13, marginBottom: 16 }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={this.handleVerifyOtp}
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                                        background: loading ? '#aaa' : '#27ae60', color: '#fff', border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12, letterSpacing: 0.3,
                                    }}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Login →'}
                                </button>

                                <button
                                    onClick={() => this.setState({ step: 1, otp: '', error: '' })}
                                    style={{ width: '100%', background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', padding: '8px 0' }}
                                >
                                    ← Back
                                </button>
                            </>
                        )}
                    </div>

                    <p style={{ color: '#bbb', fontSize: 11, marginTop: 24, textAlign: 'center' }}>
                        Digital Land Registry System · Built on Ethereum Blockchain
                    </p>
                </div>
            </div>
        );
    }
}
