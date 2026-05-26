import React, { Component } from "react";
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import { Spinner } from "react-bootstrap";
import {
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
                  <Table className="tablesorter" responsive>
                    <thead className="text-primary">
                      <tr>
                        <th>Block #</th>
                        <th>Event Type</th>
                        <th>Details</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.events.length > 0 ? (
                        this.state.events.map((evt, index) => (
                          <tr key={index}>
                            <td>{evt.blockNumber}</td>
                            <td>
                              <span
                                style={{
                                  backgroundColor:
                                    EVENT_COLORS[evt.eventType] || "#888",
                                  color: "#fff",
                                  padding: "4px 10px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {evt.eventType}
                              </span>
                            </td>
                            <td style={{ fontSize: "13px" }}>{evt.details}</td>
                            <td style={{ whiteSpace: "nowrap" }}>
                              {evt.timestamp}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
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
      </div>
    );
  }
}

export default AuditTrail;
