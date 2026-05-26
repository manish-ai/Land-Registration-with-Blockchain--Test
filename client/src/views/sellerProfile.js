import React, {Component} from 'react'
import Land from "../artifacts/Land.json"
import getWeb3 from "../getWeb3"
import { getWalletAddress } from '../services/authService'

import '../index.css';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { DrizzleProvider } from '../drizzle-shims/drizzle-react';
import { Table, Spinner } from 'react-bootstrap';
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

class sellerProfile extends Component {
    constructor(props){
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            buyers: 0,
            sellers: 0,
            verified: false,
            sellerTable: null,
            verification: null,
        }
    }

    componentDidMount = async () => {
        try{
            //Get network provider and web3 instance
            const web3 = await getWeb3();

            const accounts = await web3.eth.getAccounts();

            const currentAddress = getWalletAddress();
            console.log(currentAddress);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Land.networks[networkId];
            const instance = new web3.eth.Contract(
                Land.abi,
                deployedNetwork && deployedNetwork.address,
            );

            this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });

            var seller_verify = await instance.methods.isVerified(currentAddress).call();
            console.log(seller_verify);
            this.setState({verified: seller_verify});
            var not_verify = await instance.methods.isRejected(currentAddress).call();
            console.log(not_verify);
            let verificationEl;
            if(seller_verify){
              verificationEl = <p id="verified">Verified <i className="fas fa-user-check"></i></p>;
            }else if(not_verify){
              verificationEl = <p id="rejected">Rejected <i className="fas fa-user-times"></i></p>;
            }else{
              verificationEl = <p id="unknown">Not Yet Verified <i className="fas fa-user-cog"></i></p>;
            }

            const seller = await instance.methods.getSellerDetails(currentAddress).call();
            console.log(seller);
            console.log(seller[0]);

            const sellerTableEl = (<>
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
                      value={seller[0]}
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
                      value={seller[1]}
                    />
                  </FormGroup>
                </Col>

              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <label>Owned Lands</label>
                    <Input
                    disabled
                    type="text"
                    value={seller[2]}
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
                    value={seller[3]}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <label>Your Document</label>
                    <div className="post-meta"><span className="timestamp"> <a href={`http://localhost:4002/api/files/${seller[4]}`} target="_blank">Here</a></span></div>
                  </FormGroup>
                </Col>
              </Row></>);
            this.setState({ sellerTable: sellerTableEl, verification: verificationEl });

        }catch (error) {
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
                
                {/* <div >
                    <h5>Seller Profile</h5>
                
                        {sellerTable}
        
                </div> */}
                        <Row>
                            <Col md="8">
                                <Card>
                                    <CardHeader>
                                        <h5 className="title">Seller Profile</h5>
                                        <h5 className="title">{this.state.verification}</h5>

                                    </CardHeader>
                                    <CardBody>
                                        <Form>
                                            {this.state.sellerTable}
                                            <Button href="/seller/update-profile"  className="btn-fill" disabled={!this.state.verified} color="primary">
                                            Edit Profile
                                      </Button>
                                        </Form>
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

export default sellerProfile;