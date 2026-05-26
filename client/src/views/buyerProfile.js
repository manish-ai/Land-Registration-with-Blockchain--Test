import React, { Component } from 'react';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import "../index.css";
import { FormControl } from "react-bootstrap";
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { DrizzleProvider } from '../drizzle-shims/drizzle-react';
import { Spinner } from 'react-bootstrap';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardText,
    FormGroup,
    Form,
    Input,
    Row,
    Col,
  } from "reactstrap";

import {
    LoadingContainer,
    AccountData,
    ContractData,
    ContractForm
} from '../drizzle-shims/drizzle-react-components'

const drizzleOptions = {
    contracts: [Land]
}

class buyerProfile extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            buyers: 0,
            sellers: 0,
            verified: '',
            buyerTable: null,
            verification: null,
        }
    }

    componentDidMount = async () => {
        try {
            //Get network provider and web3 instance
            const web3 = await getWeb3();

            const accounts = await web3.eth.getAccounts();

            // Use accounts[1] for buyer — accounts[0] is used for seller registration
            const currentAddress = getWalletAddress();
            console.log(currentAddress);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Land.networks[networkId];
            const instance = new web3.eth.Contract(
                Land.abi,
                deployedNetwork && deployedNetwork.address,
            );

            this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });
            
            var buyer_verify = await instance.methods.isVerified(currentAddress).call();
            this.setState({verified: buyer_verify});
            var not_verify = await instance.methods.isRejected(currentAddress).call();
            let verificationEl;
            if(buyer_verify){
              verificationEl = <p id="verified">Verified <i className="fas fa-user-check"></i></p>;
            }else if(not_verify){
              verificationEl = <p id="rejected">Rejected <i className="fas fa-user-times"></i></p>;
            }else{
              verificationEl = <p id="unknown">Not Yet Verified <i className="fas fa-user-cog"></i></p>;
            }

            const buyer = await instance.methods.getBuyerDetails(currentAddress).call();
            console.log(buyer);
            console.log(buyer[0]);

            const buyerTableEl = (<>
            <Row>
                <Col md="12">
                  <FormGroup>
                    <label>Your Wallet Address: </label>
                    <Input
                      disabled
                      type="text"
                      value={currentAddress}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <label>Name</label>
                    <Input
                      disabled
                      type="text"
                      value={buyer[0]}
                    />
                  </FormGroup>
                </Col>

              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <label>Age</label>
                    <Input
                      disabled
                      type="text"
                      value={buyer[1]}
                    />
                  </FormGroup>
                </Col>

              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <label>City</label>
                    <Input
                      disabled
                      type="text"
                      value={buyer[2]}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <label>Email Address </label>
                    <Input
                      disabled
                      type="text"
                      value={buyer[3]}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <label>Verification ID</label>
                    <Input
                      disabled
                      type="text"
                      value={buyer[4]}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <label>Your Document</label>
                    <div className="post-meta"><span className="timestamp"> <a href={`http://localhost:4002/api/files/${buyer[5]}`} target="_blank">Here</a></span></div>
                  </FormGroup>
                </Col>
              </Row>
             </>);
            this.setState({ buyerTable: buyerTableEl, verification: verificationEl });

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

        return (
            <div className="content">
                <DrizzleProvider options={drizzleOptions}>
                    <LoadingContainer>
                        <Row>
                            <Col md="8">
                                <Card>
                                    <CardHeader>
                                        <h5 className="title">Buyer Profile</h5>
                                        <h5 className="title">{this.state.verification}</h5>

                                    </CardHeader>
                                    <CardBody>
                                        <Form>
                                            {this.state.buyerTable}
                                        </Form>
                                        <Button href="/buyer/update-profile"  className="btn-fill" disabled={!this.state.verified} color="primary">
                                            Edit Profile
                                      </Button>
                                    </CardBody>
                                    <CardFooter>

                                    </CardFooter>
                                </Card>
                            </Col>
                        </Row>
                    </LoadingContainer>
                </DrizzleProvider>
            </div>
        );

    }
}

export default buyerProfile;