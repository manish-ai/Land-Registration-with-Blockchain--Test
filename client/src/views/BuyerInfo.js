import React, { Component } from 'react';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import { Line, Bar } from "react-chartjs-2";
import '../index.css';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { DrizzleProvider } from '../drizzle-shims/drizzle-react';
import { Spinner } from 'react-bootstrap'
import {
    LoadingContainer,
    AccountData,
    ContractData,
    ContractForm
} from '../drizzle-shims/drizzle-react-components'

// reactstrap components
import {
    Button,
    ButtonGroup,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    UncontrolledDropdown,
    Label,
    FormGroup,
    Input,
    Table,
    Row,
    Col,
    UncontrolledTooltip,
} from "reactstrap";

const drizzleOptions = {
    contracts: [Land]
}

// var buyers = 0;
// var sellers = 0;
function sendMail(email, name){
    // alert(typeof(name));

    var tempParams = {
        from_name: email,
        to_name: name,
        function: 'request and buy any land/property',
    };
    
    window.emailjs.send('service_vrxa1ak', 'template_zhc8m9h', tempParams)
    .then(function(res){
        alert("Mail sent successfully");
    })
}

class BuyerInfo extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            buyers: 0,
            verified: '',
            buyerTable: [],
        }
    }

  
    verifyBuyer = (item) => async () => {
        //console.log("Hello");
        //console.log(item);

        await this.state.LandInstance.methods.verifyBuyer(
            item
        ).send({
            from: this.state.account,
            gas: 2100000
        });

        //Reload
        window.location.reload(false);

    }
    
    NotverifyBuyer = (item, email, name) => async() => {
        // alert('Before mail');
        sendMail(email, name);

        await this.state.LandInstance.methods.rejectBuyer(
            item
        ).send({
            from: this.state.account,
            gas: 2100000
        });

        window.location.reload(false);
    }

    componentDidMount = async () => {
        try {
            //Get network provider and web3 instance
            const web3 = await getWeb3();

            const accounts = await web3.eth.getAccounts();

            const currentAddress = getWalletAddress();
            //console.log(currentAddress);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Land.networks[networkId];
            const instance = new web3.eth.Contract(
                Land.abi,
                deployedNetwork && deployedNetwork.address,
            );

            this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });


            var buyersCount = await instance.methods.getBuyersCount().call();
            console.log(buyersCount);
           

            var buyersMap = [];
            buyersMap = await instance.methods.getBuyer().call();
            //console.log(buyersMap);

            var verified = await instance.methods.isLandInspector(currentAddress).call();
            //console.log(verified);
            this.setState({ verified: verified });

            const buyerTable = [];
            for (let i = 0; i < buyersCount; i++) {
                var buyer = await instance.methods.getBuyerDetails(buyersMap[i]).call();

                var buyer_verify = await instance.methods.isVerified(buyersMap[i]).call();
                console.log(buyer_verify);
                buyer.verified = buyer_verify;

                var not_verify = await instance.methods.isRejected(buyersMap[i]).call();
                console.log(not_verify);
                buyerTable.push(<tr key={i}><td>{i + 1}</td><td>{buyersMap[i]}</td><td>{buyer[0]}</td><td>{buyer[1]}</td><td>{buyer[3]}</td><td>{buyer[2]}</td><td>{buyer[4]}</td><td><a href={`http://localhost:4002/api/files/${buyer[5]}`} target="_blank">Click Here</a></td>
                    <td>{buyer.verified.toString()}</td>
                    <td>
                        <Button onClick={this.verifyBuyer(buyersMap[i])} disabled={buyer_verify || not_verify} className="button-vote">
                            Verify
                    </Button>
                    </td>
                    <td>
                        <Button onClick={this.NotverifyBuyer(buyersMap[i], buyer[3], buyer[0])} disabled={buyer_verify || not_verify} className="btn btn-danger">
                           Reject
                    </Button>
                    </td>
                </tr>)

            }
            this.setState({ buyers: buyerTable.length, buyerTable });

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

        if (!this.state.verified) {
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
            <DrizzleProvider options={drizzleOptions}>
                <LoadingContainer>
                    <div className="content">
                        <Row>
                            <Col xs="12">
                                <Card>
                                    <CardHeader>
                                        <CardTitle tag="h5">Buyers Info</CardTitle>
                                    </CardHeader>
                                    <CardBody>
                                        <Table className="tablesorter" responsive color="black">
                                            <thead className="text-primary">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Account Address</th>
                                                    <th>Name</th>
                                                    <th>Age</th>
                                                    <th>Email</th>
                                                    <th>City</th>
                                                    <th>Verification ID</th>
                                                    <th>Document</th>
                                                    <th>Verification Status</th>
                                                    <th>Verify Buyer</th>
                                                    <th>Reject Buyer</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.state.buyerTable.length > 0 ? this.state.buyerTable : (
                                                    <tr><td colSpan="11" style={{textAlign: "center", color: "#888"}}>No buyers registered yet.</td></tr>
                                                )}
                                            </tbody>

                                        </Table>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </LoadingContainer>
            </DrizzleProvider>
        );

    }
}

export default BuyerInfo;
