import React, { Component } from "react";
// nodejs library that concatenates classes
import classNames from "classnames";
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { DrizzleProvider } from '../drizzle-shims/drizzle-react';
import { Spinner } from 'react-bootstrap'
import {
  LoadingContainer,
  AccountData,
  ContractData,
  ContractForm
} from '../drizzle-shims/drizzle-react-components'
import "../index.css";
import * as govApi from '../services/govApi';
// reactstrap components
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col,
  UncontrolledTooltip,
} from "reactstrap";



const drizzleOptions = {
  contracts: [Land]
}



class Dashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      LandInstance: undefined,
      account: null,
      web3: null,
      count: 0,
      requested: false,
      bankReceipt: null,
      row: [],
    }
  }


  makePayment = (seller_address, landPID, amount, reqId) => async () => {
    // Resolve Aadhar numbers via verificationId stored on-chain (Bug 2 fix)
    const buyerDetails = await this.state.LandInstance.methods.getBuyerDetails(this.state.account).call();
    const sellerDetails = await this.state.LandInstance.methods.getSellerDetails(seller_address).call();
    const buyerVerifId = buyerDetails[4];
    const sellerVerifId = sellerDetails[3];

    const buyerAadharRes = await govApi.getAadharByVerificationId(buyerVerifId);
    const sellerAadharRes = await govApi.getAadharByVerificationId(sellerVerifId);

    if (!buyerAadharRes.found || !sellerAadharRes.found) {
      alert('Could not resolve Aadhar numbers for bank transfer. Proceeding without bank validation.');
    } else {
      // Process bank transfer with real Aadhar numbers (Bug 2 fix)
      const bankResult = await govApi.processPayment(
        buyerAadharRes.aadharNumber,
        sellerAadharRes.aadharNumber,
        amount,
        landPID
      );
      if (!bankResult.success) {
        // Bug 3 fix: show error if bank payment fails
        alert('Bank transfer failed: ' + (bankResult.message || 'Unknown error'));
        return;
      }
      this.setState({ bankReceipt: bankResult.transactionId || bankResult.txnId || 'N/A' });
    }

    // Bug 15 fix: use nominal 0.001 ETH on-chain instead of full INR-converted amount
    const nominalEth = '0.001';
    await this.state.LandInstance.methods.payment(
      seller_address,
      reqId
    ).send({
      from: this.state.account,
      value: this.state.web3.utils.toWei(nominalEth, "ether"),
      gas: 2100000
    }).then(() => {
      const receipt = this.state.bankReceipt;
      alert('Payment complete!' + (receipt ? ' Bank TXN ID: ' + receipt : ''));
      window.location.reload(false);
    });
  }

  componentDidMount = async () => {
    if (false) {
    }

    try {
      //Get network provider and web3 instance
      const web3 = await getWeb3();

      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Land.networks[networkId];
      const instance = new web3.eth.Contract(
        Land.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });

      const currentAddress = getWalletAddress();
      console.log(currentAddress);
      var registered = await instance.methods.isBuyer(currentAddress).call();
      console.log(registered);
      this.setState({ registered: registered });

      var requestsCount = await instance.methods.getRequestsCount().call();
      requestsCount = parseInt(requestsCount);

      const rowItems = [];
      for (let i = 1; i <= requestsCount; i++) {
        var request = await instance.methods.getRequestDetails(i).call();
        // request: [sellerId, buyerId, landId, requestStatus]
        if (request[1].toLowerCase() !== currentAddress.toLowerCase()) continue;
        if (!request[3]) continue; // not approved yet

        var paid = await instance.methods.isPaid(i).call();
        var price = await instance.methods.getPrice(request[2]).call();
        var landPID = await instance.methods.getPID(request[2]).call();
        const priceFormatted = '₹' + parseInt(price).toLocaleString('en-IN');
        rowItems.push(<tr key={i}><td>{i}</td><td>{request[0]}</td><td>{priceFormatted}</td>
          <td>
            <Button onClick={this.makePayment(request[0], landPID, price, i)}
            disabled={paid} className="btn btn-success">
              {paid ? 'Paid' : 'Make Payment'}
            </Button>
          </td>
        </tr>)

      }
      this.setState({ row: rowItems });




    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
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

    if (!this.state.registered) {
      return (
        <div className="content">
          <div>
            <Row>
              <Col xs="6">
                <Card className="card-chart">
                  <CardBody>
                    <h1>
                      You are not verified to view this page
                                        </h1>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>

        </div>
      );
    }

    return (
      <>
        <div className="content">
          <DrizzleProvider options={drizzleOptions}>
            <LoadingContainer>
              <Row>
                <Col lg="12" md="12">
                  <Card>
                    <CardHeader>
                      <CardTitle tag="h4">Payment for Lands</CardTitle>

                    </CardHeader>
                    <CardBody>
                      <Table className="tablesorter" responsive color="black">
                        <thead className="text-primary">
                          <tr>
                            <th>#</th>
                            <th>Land Owner</th>
                            <th>Price ( in ₹ )</th>
                            <th>Make Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.row}
                        </tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </LoadingContainer>
          </DrizzleProvider>
        </div>
      </>

    );
  }
}


export default Dashboard;
