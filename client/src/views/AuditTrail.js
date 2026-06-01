import React, { Component } from "react";
import ReactDOM from "react-dom";
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import { Spinner } from "react-bootstrap";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col,
} from "reactstrap";

const EVENT_COLORS = {
  UserRegistered: "#1d8cf8",
  LandAdded: "#00bf9a",
  LandRequested: "#ff8d72",
  RequestApproved: "#e14eca",
  PaymentDone: "#fd5d93",
  OwnershipTransferred: "#00f2c3",
};

class AuditTrail extends Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      account: null,
      LandInstance: null,
      events: [],
      loading: true,
      errorMessage: "",
      showModal: false,
      selectedEvent: null,
      modalDetails: null,
      modalLoading: false,
    };
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Land.networks[networkId];
      const instance = new web3.eth.Contract(
        Land.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState(
        { web3: web3, account: getWalletAddress(), LandInstance: instance },
        () => {
          this.loadEvents();
        }
      );
    } catch (error) {
      console.error(error);
      this.setState({
        loading: false,
        errorMessage:
          "Failed to load web3, accounts, or contract. Check console for details.",
      });
    }
  };

  loadEvents = async () => {
    const { LandInstance, web3 } = this.state;
    const allEvents = [];

    try {
      const eventNames = [
        "UserRegistered",
        "LandAdded",
        "LandRequested",
        "RequestApproved",
        "PaymentDone",
        "OwnershipTransferred",
      ];

      for (let i = 0; i < eventNames.length; i++) {
        const eventName = eventNames[i];
        try {
          const events = await LandInstance.getPastEvents(eventName, {
            fromBlock: 0,
            toBlock: "latest",
          });

          for (let j = 0; j < events.length; j++) {
            const evt = events[j];
            var block = null;
            try {
              block = await web3.eth.getBlock(evt.blockNumber);
            } catch (blockErr) {
              block = null;
            }

            var details = this.formatEventDetails(eventName, evt.returnValues);
            allEvents.push({
              blockNumber: evt.blockNumber,
              transactionHash: evt.transactionHash,
              eventType: eventName,
              details: details,
              returnValues: evt.returnValues,
              gasUsed: evt.gasUsed || null,
              timestamp: block
                ? new Date(block.timestamp * 1000).toLocaleString()
                : "N/A",
              rawTimestamp: block ? block.timestamp : 0,
            });
          }
        } catch (eventErr) {
          console.warn("Could not fetch events for " + eventName + ":", eventErr);
        }
      }

      allEvents.sort(function (a, b) {
        return a.blockNumber - b.blockNumber;
      });

      this.setState({ events: allEvents, loading: false });
    } catch (error) {
      console.error("Error loading events:", error);
      this.setState({
        loading: false,
        errorMessage: "Error loading blockchain events. Check console for details.",
      });
    }
  };

  formatEventDetails = (eventName, returnValues) => {
    switch (eventName) {
      case "UserRegistered":
        return (
          "User: " +
          this.shortenAddress(returnValues.user) +
          " | Role: " +
          returnValues.role
        );
      case "LandAdded":
        return (
          "Land ID: " +
          returnValues.landId +
          " | Owner: " +
          this.shortenAddress(returnValues.owner)
        );
      case "LandRequested":
        return (
          "Request ID: " +
          returnValues.reqId +
          " | Buyer: " +
          this.shortenAddress(returnValues.buyer) +
          " | Land ID: " +
          returnValues.landId
        );
      case "RequestApproved":
        return (
          "Request ID: " +
          returnValues.reqId +
          " | Seller: " +
          this.shortenAddress(returnValues.seller)
        );
      case "PaymentDone":
        return (
          "Buyer: " +
          this.shortenAddress(returnValues.buyer) +
          " | Seller: " +
          this.shortenAddress(returnValues.seller) +
          " | Request ID: " +
          returnValues.reqId +
          " | Amount: " +
          returnValues.amount +
          " wei"
        );
      case "OwnershipTransferred":
        return (
          "Land ID: " +
          returnValues.landId +
          " | New Owner: " +
          this.shortenAddress(returnValues.newOwner)
        );
      default:
        return JSON.stringify(returnValues);
    }
  };

  shortenAddress = (address) => {
    if (!address) return "N/A";
    return address.substring(0, 6) + "..." + address.substring(38);
  };

  openModal = async (evt) => {
    this.setState({ showModal: true, selectedEvent: evt, modalLoading: true, modalDetails: null });
    const { LandInstance, web3 } = this.state;
    const rv = evt.returnValues;
    const details = {};

    try {
      // Get transaction receipt for gas info
      if (evt.transactionHash) {
        try {
          const receipt = await web3.eth.getTransactionReceipt(evt.transactionHash);
          if (receipt) details.gasUsed = receipt.gasUsed;
          const tx = await web3.eth.getTransaction(evt.transactionHash);
          if (tx) details.from = tx.from;
        } catch (e) { /* ignore */ }
      }

      // Resolve names based on event type
      switch (evt.eventType) {
        case "UserRegistered":
          details.address = rv.user;
          details.role = rv.role;
          if (rv.role === "Seller") {
            try {
              const s = await LandInstance.methods.getSellerDetails(rv.user).call();
              details.name = s[0]; details.age = s[1]; details.landsOwned = s[2];
            } catch (e) { /* */ }
          } else if (rv.role === "Buyer") {
            try {
              const b = await LandInstance.methods.getBuyerDetails(rv.user).call();
              details.name = b[0]; details.age = b[1]; details.city = b[2]; details.email = b[3];
            } catch (e) { /* */ }
          }
          break;
        case "LandAdded":
          details.landId = rv.landId;
          details.ownerAddress = rv.owner;
          try {
            const lid = parseInt(rv.landId);
            details.area = await LandInstance.methods.getArea(lid).call();
            details.city = await LandInstance.methods.getCity(lid).call();
            details.state = await LandInstance.methods.getState(lid).call();
            details.price = await LandInstance.methods.getPrice(lid).call();
            details.pid = await LandInstance.methods.getPID(lid).call();
            details.survey = await LandInstance.methods.getSurveyNumber(lid).call();
            const sd = await LandInstance.methods.getSellerDetails(rv.owner).call();
            details.ownerName = sd[0];
          } catch (e) { /* */ }
          break;
        case "LandRequested":
          details.reqId = rv.reqId;
          details.landId = rv.landId;
          details.buyerAddress = rv.buyer;
          try {
            const bd = await LandInstance.methods.getBuyerDetails(rv.buyer).call();
            details.buyerName = bd[0];
            const lid = parseInt(rv.landId);
            details.city = await LandInstance.methods.getCity(lid).call();
            details.state = await LandInstance.methods.getState(lid).call();
            details.pid = await LandInstance.methods.getPID(lid).call();
          } catch (e) { /* */ }
          break;
        case "RequestApproved":
          details.reqId = rv.reqId;
          details.sellerAddress = rv.seller;
          try {
            const sd = await LandInstance.methods.getSellerDetails(rv.seller).call();
            details.sellerName = sd[0];
            const req = await LandInstance.methods.getRequestDetails(parseInt(rv.reqId)).call();
            details.buyerAddress = req[1];
            details.landId = req[2];
            const bd = await LandInstance.methods.getBuyerDetails(req[1]).call();
            details.buyerName = bd[0];
          } catch (e) { /* */ }
          break;
        case "PaymentDone":
          details.reqId = rv.reqId;
          details.buyerAddress = rv.buyer;
          details.sellerAddress = rv.seller;
          details.amount = rv.amount;
          try {
            const bd = await LandInstance.methods.getBuyerDetails(rv.buyer).call();
            details.buyerName = bd[0];
            const sd = await LandInstance.methods.getSellerDetails(rv.seller).call();
            details.sellerName = sd[0];
            const req = await LandInstance.methods.getRequestDetails(parseInt(rv.reqId)).call();
            details.landId = req[2];
            // Use the agreed offer price (req[4]), not the seller's listed price
            const offerPrice = parseInt(req[4]);
            details.offerPrice = offerPrice;
            details.listedPrice = parseInt(await LandInstance.methods.getPrice(parseInt(req[2])).call());
            // Karnataka charges
            const stampDuty = Math.round(offerPrice * 0.056);
            const regFee = Math.round(offerPrice * 0.01);
            const cess = Math.round(stampDuty * 0.10);
            details.stampDuty = stampDuty;
            details.registrationFee = regFee;
            details.cess = cess;
            details.totalCharges = stampDuty + regFee + cess;
            details.grandTotal = offerPrice + stampDuty + regFee + cess;
            details.pid = await LandInstance.methods.getPID(parseInt(req[2])).call();
          } catch (e) { /* */ }
          break;
        case "OwnershipTransferred":
          details.landId = rv.landId;
          details.newOwnerAddress = rv.newOwner;
          try {
            const bd2 = await LandInstance.methods.getBuyerDetails(rv.newOwner).call();
            details.newOwnerName = bd2[0];
            const lid = parseInt(rv.landId);
            details.city = await LandInstance.methods.getCity(lid).call();
            details.state = await LandInstance.methods.getState(lid).call();
            details.pid = await LandInstance.methods.getPID(lid).call();
            // Find the related request to get offer price
            const reqCount = parseInt(await LandInstance.methods.getRequestsCount().call());
            for (let ri = 1; ri <= reqCount; ri++) {
              try {
                const rq = await LandInstance.methods.getRequestDetails(ri).call();
                if (parseInt(rq[2]) === lid && rq[1].toLowerCase() === rv.newOwner.toLowerCase() && rq[3]) {
                  details.offerPrice = parseInt(rq[4]);
                  break;
                }
              } catch (e2) { /* */ }
            }
            if (!details.offerPrice) {
              details.offerPrice = parseInt(await LandInstance.methods.getPrice(lid).call());
            }
            // Karnataka charges
            const op = details.offerPrice;
            const sd2 = Math.round(op * 0.056);
            const rf2 = Math.round(op * 0.01);
            const cs2 = Math.round(sd2 * 0.10);
            details.stampDuty = sd2;
            details.registrationFee = rf2;
            details.cess = cs2;
            details.grandTotal = op + sd2 + rf2 + cs2;
          } catch (e) { /* */ }
          break;
        default:
          break;
      }
    } catch (e) {
      console.error("Error loading modal details:", e);
    }

    this.setState({ modalDetails: details, modalLoading: false });
  };

  closeModal = () => {
    this.setState({ showModal: false, selectedEvent: null, modalDetails: null });
  };

  renderModalBody = () => {
    const { selectedEvent, modalDetails, modalLoading } = this.state;
    if (!selectedEvent) return null;

    if (modalLoading) {
      return (
        <div style={{ textAlign: "center", padding: 30 }}>
          <Spinner animation="border" variant="primary" size="sm" />
          <span style={{ marginLeft: 10 }}>Loading details from blockchain...</span>
        </div>
      );
    }

    const d = modalDetails || {};
    const rowStyle = { display: "flex", padding: "6px 0", borderBottom: "1px solid #eee" };
    const labelStyle = { width: 140, fontWeight: 600, color: "#555", fontSize: 12, flexShrink: 0 };
    const valueStyle = { fontSize: 12, color: "#333", wordBreak: "break-all" };
    const monoStyle = { ...valueStyle, fontFamily: "monospace", fontSize: 11, color: "#0066cc" };

    const InfoRow = ({ label, value, mono }) => (
      value ? <div style={rowStyle}><div style={labelStyle}>{label}</div><div style={mono ? monoStyle : valueStyle}>{value}</div></div> : null
    );

    return (
      <div>
        <InfoRow label="Block Number" value={selectedEvent.blockNumber} />
        <InfoRow label="Transaction Hash" value={selectedEvent.transactionHash} mono />
        <InfoRow label="Timestamp" value={selectedEvent.timestamp} />
        {d.from && <InfoRow label="Initiated By" value={d.from} mono />}
        {d.gasUsed && <InfoRow label="Gas Used" value={d.gasUsed.toString()} />}

        <div style={{ borderTop: "2px solid #e0e0e0", margin: "14px 0" }} />

        {selectedEvent.eventType === "UserRegistered" && <>
          <InfoRow label="Role" value={d.role} />
          <InfoRow label="Name" value={d.name} />
          <InfoRow label="Wallet Address" value={d.address} mono />
          {d.age && <InfoRow label="Age" value={d.age.toString()} />}
          {d.city && <InfoRow label="City" value={d.city} />}
          {d.email && <InfoRow label="Email" value={d.email} />}
          {d.landsOwned && <InfoRow label="Lands Owned" value={d.landsOwned} />}
        </>}

        {selectedEvent.eventType === "LandAdded" && <>
          <InfoRow label="Land ID" value={d.landId} />
          <InfoRow label="Owner" value={d.ownerName || d.ownerAddress} />
          <InfoRow label="Owner Address" value={d.ownerAddress} mono />
          {d.area && <InfoRow label="Area (sq ft)" value={d.area.toString()} />}
          {d.city && <InfoRow label="City" value={d.city} />}
          {d.state && <InfoRow label="State" value={d.state} />}
          {d.price && <InfoRow label="Price" value={'₹' + parseInt(d.price).toLocaleString('en-IN')} />}
          {d.pid && <InfoRow label="Property PID" value={d.pid} />}
          {d.survey && <InfoRow label="Survey Number" value={d.survey} />}
        </>}

        {selectedEvent.eventType === "LandRequested" && <>
          <InfoRow label="Request ID" value={d.reqId} />
          <InfoRow label="Buyer" value={d.buyerName || d.buyerAddress} />
          <InfoRow label="Buyer Address" value={d.buyerAddress} mono />
          <InfoRow label="Land ID" value={d.landId} />
          {d.city && <InfoRow label="Location" value={d.city + ', ' + d.state} />}
          {d.pid && <InfoRow label="Property PID" value={d.pid} />}
        </>}

        {selectedEvent.eventType === "RequestApproved" && <>
          <InfoRow label="Request ID" value={d.reqId} />
          <InfoRow label="Seller" value={d.sellerName || d.sellerAddress} />
          <InfoRow label="Seller Address" value={d.sellerAddress} mono />
          {d.buyerName && <InfoRow label="Buyer" value={d.buyerName} />}
          {d.buyerAddress && <InfoRow label="Buyer Address" value={d.buyerAddress} mono />}
          {d.landId && <InfoRow label="Land ID" value={d.landId.toString()} />}
        </>}

        {selectedEvent.eventType === "PaymentDone" && <>
          <InfoRow label="Request ID" value={d.reqId} />
          <InfoRow label="Buyer" value={d.buyerName || d.buyerAddress} />
          <InfoRow label="Buyer Address" value={d.buyerAddress} mono />
          <InfoRow label="Seller" value={d.sellerName || d.sellerAddress} />
          <InfoRow label="Seller Address" value={d.sellerAddress} mono />
          {d.landId && <InfoRow label="Land ID" value={d.landId.toString()} />}
          {d.pid && <InfoRow label="Property PID" value={d.pid} />}
          {d.offerPrice && <InfoRow label="Agreed Sale Price" value={'₹' + d.offerPrice.toLocaleString('en-IN')} />}
          {d.listedPrice && d.listedPrice !== d.offerPrice && <InfoRow label="Original Listed Price" value={'₹' + d.listedPrice.toLocaleString('en-IN')} />}
          {d.stampDuty && <>
            <div style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }} />
            <InfoRow label="Stamp Duty (5.6%)" value={'₹' + d.stampDuty.toLocaleString('en-IN')} />
            <InfoRow label="Registration Fee (1%)" value={'₹' + d.registrationFee.toLocaleString('en-IN')} />
            <InfoRow label="Cess (10% on SD)" value={'₹' + d.cess.toLocaleString('en-IN')} />
            <div style={{ borderTop: "2px solid #333", margin: "8px 0" }} />
            <InfoRow label="Total Transaction" value={'₹' + d.grandTotal.toLocaleString('en-IN')} />
          </>}
        </>}

        {selectedEvent.eventType === "OwnershipTransferred" && <>
          <InfoRow label="Land ID" value={d.landId} />
          <InfoRow label="New Owner" value={d.newOwnerName || d.newOwnerAddress} />
          <InfoRow label="New Owner Address" value={d.newOwnerAddress} mono />
          {d.city && <InfoRow label="Location" value={d.city + ', ' + d.state} />}
          {d.pid && <InfoRow label="Property PID" value={d.pid} />}
          {d.offerPrice && <InfoRow label="Transaction Price" value={'₹' + d.offerPrice.toLocaleString('en-IN')} />}
          {d.stampDuty && <>
            <div style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }} />
            <InfoRow label="Stamp Duty (5.6%)" value={'₹' + d.stampDuty.toLocaleString('en-IN')} />
            <InfoRow label="Registration Fee (1%)" value={'₹' + d.registrationFee.toLocaleString('en-IN')} />
            <InfoRow label="Cess (10% on SD)" value={'₹' + d.cess.toLocaleString('en-IN')} />
            <div style={{ borderTop: "2px solid #333", margin: "8px 0" }} />
            <InfoRow label="Total Value" value={'₹' + d.grandTotal.toLocaleString('en-IN')} />
          </>}
        </>}
      </div>
    );
  };

  render() {
    if (!this.state.web3) {
      return (
        <div>
          <div>
            <h1>
              <Spinner animation="border" variant="primary" />
            </h1>
          </div>
        </div>
      );
    }

    if (this.state.errorMessage) {
      return (
        <div className="content">
          <Row>
            <Col xs="12">
              <Card className="card-chart">
                <CardBody>
                  <h3>{this.state.errorMessage}</h3>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      );
    }

    return (
      <div className="content">
        <Row>
          <Col lg="12" md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Blockchain Audit Trail</CardTitle>
                <p className="category">
                  Complete history of all on-chain events, sorted by block number
                </p>
              </CardHeader>
              <CardBody>
                {this.state.loading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Spinner animation="border" variant="primary" />
                    <p style={{ marginTop: "10px" }}>
                      Loading blockchain events...
                    </p>
                  </div>
                ) : (
                  <Table className="tablesorter" responsive size="sm">
                    <thead className="text-primary">
                      <tr>
                        <th>Block #</th>
                        <th>Txn Hash</th>
                        <th>Event Type</th>
                        <th>Timestamp</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.events.length > 0 ? (
                        this.state.events.map((evt, index) => (
                          <tr key={index} style={{ lineHeight: "1.2" }}>
                            <td style={{ fontSize: 12, padding: "6px 8px" }}>{evt.blockNumber}</td>
                            <td style={{ padding: "6px 8px" }}>
                              <span
                                title={evt.transactionHash}
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: "11px",
                                  color: "#1d8cf8",
                                }}
                              >
                                {evt.transactionHash
                                  ? evt.transactionHash.substring(0, 10) + "..."
                                  : "N/A"}
                              </span>
                            </td>
                            <td style={{ padding: "6px 8px" }}>
                              <span
                                style={{
                                  backgroundColor:
                                    EVENT_COLORS[evt.eventType] || "#888",
                                  color: "#fff",
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {evt.eventType}
                              </span>
                            </td>
                            <td style={{ whiteSpace: "nowrap", fontSize: 12, padding: "6px 8px" }}>
                              {evt.timestamp}
                            </td>
                            <td style={{ padding: "6px 8px" }}>
                              <Button
                                size="sm"
                                color="info"
                                style={{ fontSize: 10, padding: "2px 8px" }}
                                onClick={() => this.openModal(evt)}
                              >
                                View More
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            style={{ textAlign: "center", color: "#888" }}
                          >
                            No events found on the blockchain yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {this.state.showModal && ReactDOM.createPortal(
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)" }} onClick={this.closeModal} />
            <div style={{ position: "relative", background: "#fff", borderRadius: 8, width: 520, maxHeight: "70vh", boxShadow: "0 4px 24px rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#333" }}>
                  {this.state.selectedEvent && (
                    <span style={{
                      backgroundColor: EVENT_COLORS[this.state.selectedEvent.eventType] || "#888",
                      color: "#fff",
                      padding: "3px 10px",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 600,
                      marginRight: 8,
                    }}>
                      {this.state.selectedEvent.eventType}
                    </span>
                  )}
                  Transaction Details
                </div>
                <span onClick={this.closeModal} style={{ cursor: "pointer", fontSize: 18, color: "#999", lineHeight: 1 }}>&times;</span>
              </div>
              <div style={{ padding: "16px 20px", maxHeight: "50vh", overflowY: "auto", background: "#fafafa" }}>
                {this.renderModalBody()}
              </div>
              <div style={{ padding: "10px 20px", borderTop: "1px solid #e0e0e0", textAlign: "right" }}>
                <Button size="sm" color="secondary" onClick={this.closeModal}>Close</Button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }
}

export default AuditTrail;
