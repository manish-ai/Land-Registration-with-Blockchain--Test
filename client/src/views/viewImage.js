import React, { Component } from 'react';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { Spinner } from 'react-bootstrap';
import { Row, Col, Card, CardBody } from 'reactstrap';
import "../index.css";

const GOV_FILES = 'http://localhost:4002/api/files';

class LandGallery extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      lands: [],
    };
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
      this.setState({ web3 });

      const count = parseInt(await instance.methods.getLandsCount().call());
      const lands = [];
      for (let i = 1; i <= count; i++) {
        const area     = await instance.methods.getArea(i).call();
        const city     = await instance.methods.getCity(i).call();
        const state    = await instance.methods.getState(i).call();
        const price    = await instance.methods.getPrice(i).call();
        const pid      = await instance.methods.getPID(i).call();
        const survey   = await instance.methods.getSurveyNumber(i).call();
        const landImg  = await instance.methods.getImage(i).call();
        const document = await instance.methods.getDocument(i).call();
        lands.push({ id: i, area, city, state, price, pid, survey, landImg, document });
      }
      this.setState({ lands });
    } catch (error) {
      alert('Failed to load land gallery. Check console for details.');
      console.error(error);
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

    const { lands } = this.state;

    return (
      <div className="content">
        <h4 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>Land Gallery</h4>
        {lands.length === 0 ? (
          <Card>
            <CardBody style={{ textAlign: 'center', color: '#888', padding: 40 }}>
              No lands listed yet.
            </CardBody>
          </Card>
        ) : (
          <Row>
            {lands.map(land => (
              <Col key={land.id} lg="4" md="6" style={{ marginBottom: 24 }}>
                <Card style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}>
                  {land.landImg ? (
                    <img
                      src={`${GOV_FILES}/${land.landImg}`}
                      alt={`Land ${land.id}`}
                      style={{ width: '100%', height: 180, objectFit: 'cover' }}
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '100%', height: 180, background: '#f4f5f7',
                    display: land.landImg ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#aaa', fontSize: 13,
                  }}>
                    No Image
                  </div>
                  <CardBody style={{ padding: '16px 20px' }}>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>
                        ₹{parseInt(land.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: 4 }}>
                      {land.area} sq ft &nbsp;·&nbsp; {land.city}, {land.state}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                      PID: {land.pid}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
                      Survey No.: {land.survey}
                    </div>
                    {land.document && (
                      <a
                        href={`${GOV_FILES}/${land.document}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 13, color: '#1a5276', fontWeight: 600 }}
                      >
                        View Land Document →
                      </a>
                    )}
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    );
  }
}

export default LandGallery;
