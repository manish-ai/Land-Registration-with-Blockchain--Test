const GOV_API = 'http://localhost:4002/api';

export const verifyAadhar = async (aadharNumber, name) => {
    try {
        const res = await fetch(`${GOV_API}/verify/aadhar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aadharNumber, name })
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            verified: false,
            error: true,
            reason: "Government services unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};

export const verifyPAN = async (panNumber, name) => {
    try {
        const res = await fetch(`${GOV_API}/verify/pan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ panNumber, name })
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            verified: false,
            error: true,
            reason: "Government services unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};

export const lookupLand = async (propertyPID) => {
    try {
        const res = await fetch(`${GOV_API}/land/lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyPID })
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            found: false,
            error: true,
            message: "Government land records unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};

export const checkDuplicate = async (propertyPID, surveyNumber) => {
    try {
        const res = await fetch(`${GOV_API}/land/check-duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyPID, surveyNumber })
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            isDuplicate: false,
            error: true,
            message: "Government services unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};

export const markRegistered = async (propertyPID, blockchainTxHash) => {
    try {
        const res = await fetch(`${GOV_API}/land/mark-registered`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyPID, blockchainTxHash })
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            success: false,
            error: true,
            message: "Government services unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};

export const processPayment = async (buyerAadhar, sellerAadhar, amount, landPID) => {
    try {
        const res = await fetch(`${GOV_API}/bank/process-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buyerAadhar, sellerAadhar, amount, landPID })
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            success: false,
            error: true,
            message: "Bank services unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};

export const getBankAccount = async (aadharNumber) => {
    try {
        const res = await fetch(`${GOV_API}/bank/account/${encodeURIComponent(aadharNumber)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            found: false,
            error: true,
            message: "Bank services unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};

export const getEthRate = async () => {
    try {
        const res = await fetch(`${GOV_API}/oracle/eth-inr`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            rate: null,
            error: true,
            message: "Price oracle unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};

export const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${GOV_API}/files/upload`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            fileId: null,
            error: true,
            message: "File upload service unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};

export const getFileUrl = (fileId) => {
    return `${GOV_API}/files/${fileId}`;
};

export const getAadharByVerificationId = async (verificationId) => {
    try {
        const res = await fetch(`${GOV_API}/verify/aadhar-by-id/${encodeURIComponent(verificationId)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            found: false,
            error: true,
            message: "Government services unavailable. Is the Gov Portal running on port 4002?"
        };
    }
};
