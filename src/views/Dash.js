import React, { useContext, useState, useEffect } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { Image, Icon } from "semantic-ui-react";
import { UserContext } from "../providers/UserProvider";
import Team from "../components/team";
import LogoutModal from "../components/LogoutModal";
import PasswordModal from "../components/PasswordModal";
import NewPasswordModal from "../components/NewPassword";
import Files from "../components/Files";
import { isUser, getUser } from "../api/Calls";
import { decryptPrivateKey } from "../api/Crypto";

const Dash = () => {
  const user = useContext(UserContext);
  const [keys, setKeys] = useState({});
  const [pic, setPic] = useState("");
  const [name, setName] = useState("");
  const [add, setAdd] = useState("");
  const [flag, setFlag] = useState(false);
  const [password, setPassword] = useState("");
  const [incorrect, setIncorrect] = useState(false);
  const [logoutModalShow, setLogoutShow] = useState(false);
  const [passwordModalShow, setPasswordShow] = useState(false);
  const [newPasswordShow, setNewPasswordShow] = useState(false);
  const [view, setView] = useState("1");

  useEffect(() => {
    updateData();
  }, [user, password, flag, view]);

  const updateData = async () => {
    let { photoURL, displayName, email } = user;
    setPic(photoURL);
    setName(displayName);
    setAdd(email);
    let userinfo = await isUser(email);
    if (userinfo) {
      if (password !== null) {
        getPassword().then(async () => {
          userinfo = await getUser(email, password);
          let decpair = await decryptPrivate(userinfo.keys);
          setKeys(decpair);
        });
      }
    } else {
      if (!flag) setNewPasswordShow(true);
      else {
        userinfo = await getUser(email, password);
        let decpair = await decryptPrivate(userinfo.keys);
        setKeys(decpair);
      }
    }
  };

  const getPassword = () => {
    return new Promise((resolve) => {
      if (password === "") setPasswordShow(true);
      else if (password === null) resolve();
      else resolve();
    });
  };

  const decryptPrivate = (encpair) => {
    return new Promise(async (resolve) => {
      let decpair = encpair;
      decpair = await decryptPrivateKey(encpair, password);
      if (!decpair) {
        setPassword("");
        setIncorrect(true);
        getPassword();
        return;
      }
      setPassword(null);
      resolve(decpair);
    });
  };

  const handleLogout = () => {
    setLogoutShow(true);
  };

  const toggleView = (e) => {
    const id = e.target.id;
    if (id === "1" || id === "2") {
      setView(id);
    } else {
      // Handle other views if needed
    }
  };

  return (
    <Col className="h-100">
      <LogoutModal
        logoutModalShow={logoutModalShow}
        setLogoutShow={setLogoutShow}
      />
      <PasswordModal
        passwordModalShow={passwordModalShow}
        setPasswordShow={setPasswordShow}
        setPassword={setPassword}
        incorrect={incorrect}
      />
      <NewPasswordModal
        newPasswordShow={newPasswordShow}
        setNewPasswordShow={setNewPasswordShow}
        setPassword={setPassword}
        setFlag={setFlag}
      />
      <Row className="h-100">
        <Col md={2} className="bg-info text-light d-flex flex-column">
          <div className="flex-none">
            <div className="pt-4 pb-2 text-center">
              <h2>
                <Icon name="cloud" className="mr-3" />
                CryptGuard
              </h2>
              <h4>Your Personal Secure Cloud.</h4>
            </div>
          </div>
          <div className="grow py-4 d-flex flex-column justify-content-start align-items-center">
            <div className="col d-flex flex-column align-items-center">
              <div className="pb-4 w-100 d-flex flex-row justify-content-center align-items-center space-around">
                <Image src={pic} avatar />
                <span className="ml-2">{name}</span>
              </div>
              <div className="pb-2 w-100">
                <Button
                  variant="light"
                  id="1"
                  onClick={toggleView}
                  className="w-100 text-info"
                >
                  My Files
                </Button>
              </div>
              <div className="pb-2 w-100">
                <Button
                  variant="light"
                  id="2"
                  onClick={toggleView}
                  className="w-100 text-info"
                >
                  Developer Team
                </Button>
              </div>
              <div className="pb-2 w-100">
                <Button
                  variant="light"
                  className="w-100 text-info"
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </Col>
        <Col md={10} className="bg-light text-dark">
          {view === "1" ? (
            <Files email={add} keys={keys} />
          ) : (
            <Team onNavigate={toggleView} />
          )}
        </Col>
      </Row>
    </Col>
  );
};

export default Dash;
