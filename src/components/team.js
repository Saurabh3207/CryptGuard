import React from "react";
import { Card, Button } from "react-bootstrap";
import { Icon } from "semantic-ui-react";
import Saurabh from "../Assets/Saurabh.jpg";
import Avishkar from "../Assets/avishkar.jpg";
import Jaydeep from "../Assets/jaydeep.jpg";
import Vaishnavi from "../Assets/vaishnavi.jpg";
import Sir from "../Assets/Sir.jpg";
import "../components/Team.css";


const Team = () => {

  return (
    <div className="team-container">
      <h2>Team Members</h2>
      <div className="team-cards">
        <div className="team-card">
          <Card>
            <Card.Img variant="top" src={Saurabh} />
            <Card.Body>
              <Card.Title>Saurabh Jadhav</Card.Title>
              <div className="icon-container">
                <a href=" https://www.linkedin.com/in/saurabh-jadhav-44825b261?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app_share" target="_blank" rel="noopener noreferrer">
                <Icon name="linkedin" link size="big" />
                </a>
                < a href="https://github.com/Saurabh3207" target="_blank" rel="noopener noreferrer">
                <Icon name="github" link size="big" />
                </a>

              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="team-card">
          <Card>
            <Card.Img variant="top" src={Avishkar} />
            <Card.Body>
              <Card.Title>Avishkar Pokale</Card.Title>
              <div className="icon-container">
              <a href="https://www.linkedin.com/in/avishkar-pokale-55058524a" target="_blank" rel="noopener noreferrer">
                <Icon name="linkedin" link size="big" />
                </a>
                <a href = "https://github.com/Avi-Pokale" target="_blank" rel="noopener noreferrer">
                <Icon name="github" link size="big" />
                </a>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="team-card">
          <Card>
            <Card.Img variant="top" src={Jaydeep} />
            <Card.Body>
              <Card.Title>Jaydeep Jadhav</Card.Title>
              <div className="icon-container">
                <Icon name="instagram" link size="big" />
                <Icon name="github" link size="big" />
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="team-card">
          <Card>
            <Card.Img variant="top" src={Vaishnavi} />
            <Card.Body>
              <Card.Title>Vaishnavi Powar</Card.Title>
              <div className="icon-container">
                <Icon name="instagram" link size="big" />
                <Icon name="github" link size="big" />
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="team-card">
          <Card>
            <Card.Img variant="top" src={Sir} />
            <Card.Body>
            
              <Card.Title>Guided By : Vinayak Musale</Card.Title>
              <div className="icon-container">
                <Icon name="instagram" link size="big" />
                <Icon name="github" link size="big" />
             </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Team;
