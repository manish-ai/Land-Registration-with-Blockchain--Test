import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle, Row, Col } from "reactstrap";

const faqs = [
  {
    section: "Getting Started",
    items: [
      {
        q: "How do I log in to the Land Registry system?",
        a: "Visit the home page and enter your Aadhar number or PAN number. Click 'Send OTP' — the system will verify your identity against government records. Enter the OTP sent to your registered mobile number (demo OTP is 1234). After verification, you will be redirected to your role-specific dashboard (Inspector, Seller, or Buyer).",
      },
      {
        q: "How do I register as a Seller?",
        a: "Go to the Register Seller page from the login screen. Fill in your personal details (Name, Age, Aadhar, PAN, number of lands owned). Click 'Verify with UIDAI' to confirm your Aadhar identity and 'Verify with Income Tax' to confirm your PAN. Optionally upload an identity document. Click 'Register on Blockchain' to complete registration. Note: registration requires a pending Land Inspector approval before you can add lands.",
      },
      {
        q: "How do I register as a Buyer?",
        a: "Go to the Register Buyer page from the login screen. Fill in your details (Name, Age, City, Email, Aadhar, PAN). Verify your Aadhar with UIDAI and PAN with Income Tax. Click 'Register on Blockchain'. You will need Land Inspector verification before you can request land purchases.",
      },
    ],
  },
  {
    section: "Buying Land",
    items: [
      {
        q: "I registered as a Buyer but cannot request any land. Why?",
        a: "Your profile must be verified by the Land Inspector before you can request a land. The Inspector reviews all registered buyers and clicks 'Verify' against your record. Once verified, the 'Request Land' button will become active for you on the Available Lands table.",
      },
      {
        q: "How do I request to purchase a land?",
        a: "After being verified, go to your Dashboard. The 'Available Lands' table shows all lands listed for sale. Click the 'Request Land' button on the row you want. A blockchain transaction will be submitted. Once mined, the request appears under 'My Land Requests'.",
      },
      {
        q: "How do I make payment after the seller accepts my request?",
        a: "Go to 'Make Payment' in the sidebar. Lands with accepted requests will appear here with their price and ETH equivalent. Click 'Make Payment' — a small ETH transaction (0.001 ETH nominal) is sent to confirm payment on-chain. The button changes to 'Paid' once complete.",
      },
      {
        q: "How do I confirm that I now own a land?",
        a: "After payment and Land Inspector approval, go to 'Owned Lands' in the sidebar. The land will appear in your ownership table with all details (Area, City, State, Price, PID, Survey Number).",
      },
    ],
  },
  {
    section: "Selling Land",
    items: [
      {
        q: "I registered as a Seller but the 'Add Land' button is disabled. Why?",
        a: "Similar to buyers, sellers must be verified by the Land Inspector first. Once the Inspector marks your profile as verified, the 'Add Land' button becomes active and you can list your properties.",
      },
      {
        q: "How do I list a land for sale?",
        a: "After being verified, click 'Add Land' in the sidebar. Fill in the property details: Area (sq ft), City, State, Price (in ETH), Property PID, and Survey Number. Optionally upload a property image. Click 'Add Land' to register it on the blockchain.",
      },
      {
        q: "How do I handle a buyer's purchase request for my land?",
        a: "Go to 'Land Requests' in the sidebar. You will see all incoming requests with the buyer address, land ID, and request status. Click 'Accept Offer' to approve the buyer's request. This enables the buyer to proceed to payment.",
      },
    ],
  },
  {
    section: "Land Inspector (Admin)",
    items: [
      {
        q: "How does the Land Inspector verify buyers and sellers?",
        a: "Log in with the Inspector Aadhar (100000000001) and OTP 1234. From the dashboard, go to 'Buyer Info' or 'Seller Info'. Each registered user is shown with their details and a 'Verify' button. Click Verify to approve them — this updates the blockchain and unlocks their ability to transact.",
      },
      {
        q: "How does the Land Inspector approve a final ownership transfer?",
        a: "After a buyer has paid for a land, go to 'Approve Transfer' in the sidebar. Transactions where payment is complete will have the 'Approve Land Transfer' button enabled. Click it to transfer blockchain ownership from the seller to the buyer.",
      },
      {
        q: "What is the Audit Trail?",
        a: "The Audit Trail shows a full log of all activity on the platform fetched from the government portal — registrations, verifications, land additions, payment events, and ownership transfers. This is only accessible to the Land Inspector for oversight and accountability.",
      },
    ],
  },
  {
    section: "Technical & Blockchain",
    items: [
      {
        q: "What blockchain is this system running on?",
        a: "The system runs on a local Ethereum testnet powered by Ganache. All transactions (registrations, requests, payments, transfers) are recorded as immutable on-chain events. The smart contract address is determined at deployment time via Truffle migrate.",
      },
      {
        q: "Why do I see a loading spinner and nothing loads?",
        a: "Ensure all three services are running: Ganache on port 7545, the Government Portal (node server.js) on port 4002, and the DApp (npm start) on port 4000. Also make sure the smart contracts have been deployed with 'truffle migrate --reset'.",
      },
      {
        q: "Can the same wallet address register as both Buyer and Seller?",
        a: "No. Each Ethereum wallet address can only register under one role (Buyer or Seller) due to a single RegisteredAddress mapping in the smart contract. The government portal assigns a unique wallet address to each citizen, so simply use different Aadhar credentials to test different roles.",
      },
      {
        q: "Why is my session lost when I open a new browser tab?",
        a: "Sessions are stored in sessionStorage which is scoped to each browser tab. This is intentional — it lets you test all three roles simultaneously in separate tabs without them interfering with each other. Simply log in again in a new tab.",
      },
    ],
  },
];

export default function Help() {
  const [openItem, setOpenItem] = useState(null);

  const toggle = (key) => setOpenItem(openItem === key ? null : key);

  return (
    <div className="content">
      <Row>
        <Col lg="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Help &amp; FAQ</CardTitle>
              <p style={{ color: "#9a9a9a", marginBottom: 0, fontSize: 14 }}>
                Answers to common questions about the Land Registry system
              </p>
            </CardHeader>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginBottom: 12 }}>
        <Col lg="12">
          <div style={{
            background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
            borderRadius: 12,
            padding: "20px 28px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 4,
          }}>
            <div style={{ fontSize: 36 }}>🏛️</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Land Registry — How It Works</div>
              <div style={{ color: "#b8cef9", fontSize: 13, marginTop: 4 }}>
                A blockchain-based land ownership platform. Sellers list land, buyers request purchase, the Land Inspector verifies all parties and approves the final ownership transfer on-chain.
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {faqs.map((section, sIdx) => (
        <Row key={sIdx}>
          <Col lg="12">
            <Card style={{ marginBottom: 8 }}>
              <CardHeader style={{ paddingBottom: 8 }}>
                <CardTitle tag="h5" style={{ margin: 0, color: "#e14eca" }}>{section.section}</CardTitle>
              </CardHeader>
              <CardBody style={{ paddingTop: 0 }}>
                {section.items.map((item, iIdx) => {
                  const key = `${sIdx}-${iIdx}`;
                  const isOpen = openItem === key;
                  return (
                    <div
                      key={iIdx}
                      style={{
                        borderBottom: iIdx < section.items.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                        padding: "2px 0",
                      }}
                    >
                      <button
                        onClick={() => toggle(key)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          padding: "12px 4px",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          color: isOpen ? "#e14eca" : "#344675",
                          fontWeight: 600,
                          fontSize: 14,
                          transition: "color 0.2s",
                        }}
                      >
                        <span>{item.q}</span>
                        <span style={{ fontSize: 18, lineHeight: 1, color: "#9a9a9a", marginLeft: 12 }}>
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                      {isOpen && (
                        <div style={{
                          padding: "4px 4px 16px",
                          color: "#b0b0b0",
                          fontSize: 13.5,
                          lineHeight: 1.7,
                          borderLeft: "3px solid #e14eca",
                          paddingLeft: 14,
                          marginBottom: 4,
                        }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          </Col>
        </Row>
      ))}

      <Row>
        <Col lg="12">
          <Card style={{ background: "rgba(30,60,114,0.18)", border: "1px solid rgba(30,60,114,0.4)" }}>
            <CardBody style={{ padding: "16px 20px" }}>
              <div style={{ color: "#9a9a9a", fontSize: 13 }}>
                <strong style={{ color: "#fff" }}>Quick Test Credentials</strong>
                &nbsp;—&nbsp;
                Inspector: Aadhar <code style={{ color: "#e14eca" }}>100000000001</code>
                &nbsp;|&nbsp;
                Seller: Aadhar <code style={{ color: "#e14eca" }}>123456789012</code>
                &nbsp;|&nbsp;
                Buyer: Aadhar <code style={{ color: "#e14eca" }}>234567890123</code>
                &nbsp;|&nbsp;
                OTP (all): <code style={{ color: "#e14eca" }}>1234</code>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
