import React, { Component } from 'react';
import './index.css';
import { sendOtp, verifyOtp, isLoggedIn, getRole } from './services/authService';

export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 1,           // 1 = enter ID, 2 = enter OTP
            idType: 'aadhar',  // 'aadhar' or 'pan'
            identifier: '',
            otp: '',
            citizenName: '',
            maskedPhone: '',
            loading: false,
            error: '',
        };
    }

    componentDidMount() {
        // If already logged in, redirect to correct portal
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
            <div className="bodyC">
                <div className="img-wrapper">
                    <img
                        src="https://i.pinimg.com/originals/71/6e/00/716e00537e8526347390d64ec900107d.png"
                        className="logo"
                        alt="Logo"
                    />
                    <div className="wine-text-container">
                        <div className="site-title wood-text">Land Registry</div>
                    </div>
                </div>

                <div className="auth-wrapper">
                    <div className="auth-inner" style={{ maxWidth: 420 }}>
                        <h2 style={{ color: 'black', fontWeight: 600, marginBottom: 4 }}>
                            Secure Login
                        </h2>
                        <p style={{ color: '#555', marginBottom: 20, fontSize: 13 }}>
                            Powered by Government Digital Identity
                        </p>

                        {step === 1 && (
                            <>
                                <div className="form-group" style={{ marginBottom: 12 }}>
                                    <label style={{ color: '#333', fontWeight: 500 }}>
                                        Login with
                                    </label>
                                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                                        <button
                                            onClick={() => this.setState({ idType: 'aadhar', error: '' })}
                                            className={`btn btn-sm ${idType === 'aadhar' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        >
                                            Aadhar
                                        </button>
                                        <button
                                            onClick={() => this.setState({ idType: 'pan', error: '' })}
                                            className={`btn btn-sm ${idType === 'pan' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        >
                                            PAN
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label style={{ color: '#333', fontWeight: 500 }}>
                                        {idType === 'aadhar' ? 'Aadhar Number' : 'PAN Number'}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={idType === 'aadhar' ? '12-digit Aadhar number' : 'PAN (e.g. ABCDE1234F)'}
                                        value={identifier}
                                        onChange={e => this.setState({ identifier: e.target.value, error: '' })}
                                        onKeyDown={e => e.key === 'Enter' && this.handleSendOtp()}
                                    />
                                </div>

                                {error && (
                                    <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: 13 }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    className="btn btn-primary w-100"
                                    onClick={this.handleSendOtp}
                                    disabled={loading}
                                    style={{ marginBottom: 12 }}
                                >
                                    {loading ? 'Verifying...' : 'Send OTP'}
                                </button>

                                <p style={{ color: '#777', fontSize: 12, textAlign: 'center' }}>
                                    Don't have an account?{' '}
                                    <a href="/RegisterBuyer" style={{ color: '#3b82f6' }}>Register as Buyer</a>
                                    {' | '}
                                    <a href="/RegisterSeller" style={{ color: '#3b82f6' }}>Register as Seller</a>
                                </p>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    marginBottom: 16,
                                }}>
                                    <p style={{ margin: 0, color: '#166534', fontWeight: 600 }}>
                                        Welcome, {citizenName}
                                    </p>
                                    <p style={{ margin: '4px 0 0', color: '#15803d', fontSize: 13 }}>
                                        {maskedPhone}
                                    </p>
                                    <p style={{ margin: '6px 0 0', color: '#166534', fontSize: 12 }}>
                                        Demo OTP: <strong>1234</strong>
                                    </p>
                                </div>

                                <div className="form-group" style={{ marginBottom: 16 }}>
                                    <label style={{ color: '#333', fontWeight: 500 }}>
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter 4-digit OTP"
                                        value={otp}
                                        maxLength={6}
                                        onChange={e => this.setState({ otp: e.target.value, error: '' })}
                                        onKeyDown={e => e.key === 'Enter' && this.handleVerifyOtp()}
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: 13 }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    className="btn btn-success w-100"
                                    onClick={this.handleVerifyOtp}
                                    disabled={loading}
                                    style={{ marginBottom: 10 }}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </button>

                                <button
                                    className="btn btn-link w-100"
                                    onClick={() => this.setState({ step: 1, otp: '', error: '' })}
                                    style={{ color: '#666', fontSize: 13 }}
                                >
                                    ← Back / Use different ID
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
