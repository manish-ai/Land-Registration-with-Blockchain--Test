import React, { Component } from "react";
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap'
import "../index.css";
import * as govApi from '../services/govApi';
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


class Dashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      LandInstance: undefined,
      account: null,
      web3: null,
      registered: false,
      payments: [],
      // UI feedback
      toast: null,       // { type: 'success'|'error'|'info', message: string }
      processingId: null, // reqId currently being processed
    }
  }

  showToast = (type, message) => {
    this.setState({ toast: { type, message } });
    if (type === 'success') {
      setTimeout(() => this.setState({ toast: null }), 6000);
    }
  }

  dismissToast = () => {
    this.setState({ toast: null });
  }

  makePayment = (payment) => async () => {
    const { seller, landPID, price, reqId } = payment;
    this.setState({ processingId: reqId, toast: null });

    try {
      // Step 1: Resolve Aadhar numbers
      const buyerDetails = await this.state.LandInstance.methods.getBuyerDetails(this.state.account).call();
      const sellerDetails = await this.state.LandInstance.methods.getSellerDetails(seller).call();

      const buyerAadharRes = await govApi.getAadharByVerificationId(buyerDetails[4]);
      const sellerAadharRes = await govApi.getAadharByVerificationId(sellerDetails[3]);

      if (!buyerAadharRes.found || !sellerAadharRes.found) {
        this.showToast('error', 'Could not resolve Aadhar numbers for bank transfer. Please contact support.');
        this.setState({ processingId: null });
        return;
      }

      // Step 2: Process bank payment
      const bankResult = await govApi.processPayment(
        buyerAadharRes.aadharNumber,
        sellerAadharRes.aadharNumber,
        price,
        landPID
      );

      if (!bankResult.success) {
        let errorMsg = bankResult.message || 'Unknown error';
        if (bankResult.buyerBalance !== undefined && bankResult.requiredAmount !== undefined) {
          errorMsg += ` (Your balance: ₹${Number(bankResult.buyerBalance).toLocaleString('en-IN')}, Required: ₹${Number(bankResult.requiredAmount).toLocaleString('en-IN')})`;
        }
        this.showToast('error', errorMsg);
        this.setState({ processingId: null });
        return;
      }

      // Step 3: Record on blockchain
      const nominalEth = '0.001';
      await this.state.LandInstance.methods.payment(
        seller,
        reqId
      ).send({
        from: this.state.account,
        value: this.state.web3.utils.toWei(nominalEth, "ether"),
        gas: 2100000
      });

      const txnId = bankResult.transactionId || bankResult.txnId || '';
      this.showToast('success', 'Payment successful!' + (txnId ? ' Bank TXN: ' + txnId : ''));
      // Update the paid status locally
      this.setState(prev => ({
        processingId: null,
        payments: prev.payments.map(p => p.reqId === reqId ? { ...p, paid: true } : p)
      }));

    } catch (err) {
      console.error('Payment error:', err);
      let msg = 'Payment failed. ';
      if (err.message && err.message.includes('revert')) {
        msg += 'Transaction was rejected by the smart contract.';
      } else if (err.message && err.message.includes('User denied')) {
        msg += 'Transaction was cancelled.';
      } else {
        msg += (err.message || 'Please try again.');
      }
      this.showToast('error', msg);
      this.setState({ processingId: null });
    }
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Land.networks[networkId];
      const instance = new web3.eth.Contract(
        Land.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });

      const currentAddress = getWalletAddress();
      var registered = await instance.methods.isBuyer(currentAddress).call();
      this.setState({ registered: registered });

      var requestsCount = await instance.methods.getRequestsCount().call();
      requestsCount = parseInt(requestsCount);

      const payments = [];
      for (let i = 1; i <= requestsCount; i++) {
        var request = await instance.methods.getRequestDetails(i).call();
        if (request[1].toLowerCase() !== currentAddress.toLowerCase()) continue;
        if (!request[3]) continue; // not approved yet

        var paid = await instance.methods.isPaid(i).call();
        var price = parseInt(await instance.methods.getPrice(request[2]).call());
        var landPID = await instance.methods.getPID(request[2]).call();
        var city = await instance.methods.getCity(request[2]).call();
        var state = await instance.methods.getState(request[2]).call();
        let sellerName = request[0];
        try {
          const sellerDetails = await instance.methods.getSellerDetails(request[0]).call();
          if (sellerDetails[0]) sellerName = sellerDetails[0];
        } catch (e) { /* fallback to address */ }

        payments.push({ reqId: i, seller: request[0], sellerName, landPID, city, state, price, paid });
      }
      this.setState({ payments });

    } catch (error) {
      console.error(error);
      this.showToast('error', 'Failed to load contract data. Make sure Ganache is running and the contract is deployed.');
    }
  };

  render() {
    if (!this.state.web3) {
      return (
        <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }

    if (!this.state.registered) {
      return (
        <div className="content">
          <Row><Col xs="6">
            <Card><CardBody>
              <h4 style={{ color: '#e14eca' }}>You are not verified to view this page.</h4>
            </CardBody></Card>
          </Col></Row>
        </div>
      );
    }

    const { toast, payments, processingId } = this.state;

    return (
      <>
        <div className="content">
          {/* Toast notification */}
          {toast && (
            <Row>
              <Col lg="12">
                <div style={{
                  background: toast.type === 'success' ? '#f0fdf4' : toast.type === 'error' ? '#fef2f2' : '#eff6ff',
                  border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : toast.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
                  borderRadius: 8,
                  padding: '14px 18px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>
                      {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
                    </span>
                    <div>
                      <strong style={{
                        color: toast.type === 'success' ? '#166534' : toast.type === 'error' ? '#991b1b' : '#1e40af',
                        fontSize: 14,
                      }}>
                        {toast.type === 'success' ? 'Payment Successful' : toast.type === 'error' ? 'Payment Failed' : 'Info'}
                      </strong>
                      <p style={{
                        color: toast.type === 'success' ? '#15803d' : toast.type === 'error' ? '#b91c1c' : '#1d4ed8',
                        fontSize: 13, margin: '4px 0 0 0',
                      }}>
                        {toast.message}
                      </p>
                    </div>
                  </div>
                  <button onClick={this.dismissToast} style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1,
                    color: toast.type === 'success' ? '#166534' : toast.type === 'error' ? '#991b1b' : '#1e40af',
                    padding: 0,
                  }}>×</button>
                </div>
              </Col>
            </Row>
          )}

          <Row>
            <Col lg="12" md="12">
              <Card>
                <CardHeader>
                  <CardTitle tag="h4">Payment for Lands</CardTitle>
                </CardHeader>
                <CardBody>
                  <Table className="tablesorter" responsive>
                    <thead className="text-primary">
                      <tr>
                        <th>#</th>
                        <th>Land Owner</th>
                        <th>Property</th>
                        <th>Price (₹)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length > 0 ? payments.map(p => (
                        <tr key={p.reqId}>
                          <td>{p.reqId}</td>
                          <td>{p.sellerName}</td>
                          <td>{p.landPID}<br /><small style={{ color: '#888' }}>{p.city}, {p.state}</small></td>
                          <td>₹{p.price.toLocaleString('en-IN')}</td>
                          <td>
                            {p.paid ? (
                              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#d1fae5', color: '#166534' }}>
                                Paid
                              </span>
                            ) : (
                              <Button
                                onClick={this.makePayment(p)}
                                disabled={processingId === p.reqId}
                                color="success"
                                size="sm"
                                className="btn-fill"
                              >
                                {processingId === p.reqId ? 'Processing...' : 'Make Payment'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" style={{ textAlign: 'center', color: '#888', padding: 20 }}>
                          No approved payments pending. Offers must be accepted by the seller before payment.
                        </td></tr>
                      )}
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </>
    );
  }
}


export default Dashboard;
