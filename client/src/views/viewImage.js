import React, { Component } from 'react';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import { DrizzleProvider } from '../drizzle-shims/drizzle-react';
import { Spinner  } from 'react-bootstrap';
import {
  LoadingContainer,
  AccountData,
  ContractData,
  ContractForm
} from '../drizzle-shims/drizzle-react-components';
import "../index.css";

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


class viewImage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      LandInstance: undefined,
      account: null,
      web3: null,
      row: [],
    }
  }

  componentDidMount = async () => {


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

      const currentAddress = getWalletAddress();
      console.log(currentAddress);
      this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });

      var count = await instance.methods.getLandsCount().call();
      count = parseInt(count);
      console.log(typeof (count));
      console.log(count);
      //this.setState({count:count});

      var rowsArea = [];
      var rowsCity = [];
      var rowsState = [];
      var rowsSt = [];
      var rowsPrice = [];
      var rowsPID = [];
      var rowsSurvey = [];

      for (var i = 1; i < count + 1; i++) {
        rowsArea.push(<ContractData contract="Land" method="getArea" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
        rowsCity.push(<ContractData contract="Land" method="getCity" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
        rowsState.push(<ContractData contract="Land" method="getState" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
        rowsSt.push(<ContractData contract="Land" method="getStatus" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
        rowsPrice.push(<ContractData contract="Land" method="getPrice" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
        rowsPID.push(<ContractData contract="Land" method="getPID" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
        rowsSurvey.push(<ContractData contract="Land" method="getSurveyNumber" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
      // rowsIpfs.push((<ContractData contract="Land" method="getImage"  methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />));
      }
      

      const landRow = [];
      for (var i = 1; i < count + 1; i++) {
        var landImg = await instance.methods.getImage(i).call();
        var document = await instance.methods.getDocument(i).call();
        landRow.push(<Col key={i} xs="6">
        <div className="post-module">
          <div className="thumbnail">
            <div className="date">
            <div className="day">{i}</div>
            </div><img src={`http://localhost:4002/api/files/${landImg}`} alt="land"/>
          </div>
          <div className="post-content">
            <div className="category">Photos</div>
            <h1 className="title">{rowsArea[i-1]} Sq. m.</h1>
            <h2 className="sub_title">{rowsCity[i-1]}, {rowsState[i-1]}</h2>
            <p className="description">PID: {rowsPID[i-1]}<br/> Survey No.: {rowsSurvey[i-1]}</p>
            <div className="post-meta"><span className="timestamp">Price: ₹ {rowsPrice[i-1]}</span></div>
            <div className="post-meta"><span className="timestamp">View Verified Land  <a href={`http://localhost:4002/api/files/${document}`} target="_blank">Document</a></span></div>
          </div>
        </div>
      </Col>)
      }
      this.setState({ row: landRow });

      

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
      <>
        <div className="content">
          <DrizzleProvider options={drizzleOptions}>
            <LoadingContainer>

              <Row>

                {this.state.row}

              </Row>
            </LoadingContainer>
          </DrizzleProvider>

        </div>
      </>

    );

  }
}

export default viewImage;