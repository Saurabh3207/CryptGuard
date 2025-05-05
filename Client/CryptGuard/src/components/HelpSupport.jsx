import React, { useState } from "react";
import { FaChevronDown, FaChevronUp, FaQuestionCircle, FaTools, FaFileAlt } from "react-icons/fa";

const HelpSupport = () => {
  // State for collapsible FAQ sections
  const [faqOpen, setFaqOpen] = useState({});

  const toggleFaq = (index) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8">Help & Support</h1>

      {/* FAQ Section */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {["What is CryptGuard?", "How do I upload files?", "How do I verify file integrity?"].map((question, index) => (
            <div key={index} className="border-b pb-4">
              <div
                onClick={() => toggleFaq(index)}
                className="flex items-center justify-between cursor-pointer text-lg font-semibold text-gray-700 hover:text-violet-600"
              >
                <span>{question}</span>
                <span>
                  {faqOpen[index] ? (
                    <FaChevronUp className="text-violet-600" />
                  ) : (
                    <FaChevronDown className="text-violet-600" />
                  )}
                </span>
              </div>

              {/* FAQ Answer with smooth height animation */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out mt-2 text-gray-600 ${
                  faqOpen[index] ? "h-auto" : "h-0"
                }`}
              >
                <p>
                  {index === 0
                    ? "CryptGuard is a decentralized file management system that leverages blockchain technology and IPFS for secure file storage."
                    : index === 1
                    ? "Click the 'Upload File' button, select your file, and CryptGuard will securely encrypt and upload your file to IPFS."
                    : "After downloading your file, verify its hash against the one stored on the blockchain to ensure it hasn't been tampered with."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Getting Started Guide */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Getting Started</h2>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-700">
            <FaQuestionCircle className="inline mr-2 text-violet-600" />
            Step 1: Connect Your Wallet
          </h3>
          <p className="text-gray-600">
            Click on the "Connect Wallet" button to link your MetaMask wallet to CryptGuard. Ensure you have MetaMask installed and configured.
          </p>

          <h3 className="font-semibold text-lg text-gray-700">
            <FaTools className="inline mr-2 text-violet-600" />
            Step 2: Upload a File
          </h3>
          <p className="text-gray-600">
            Click "Upload File", select a file, and CryptGuard will encrypt and upload the file to IPFS.
          </p>

          <h3 className="font-semibold text-lg text-gray-700">
            <FaFileAlt className="inline mr-2 text-violet-600" />
            Step 3: Verify File Integrity
          </h3>
          <p className="text-gray-600">
            After downloading your file, verify its integrity by checking the file hash on the blockchain.
          </p>
        </div>
      </section>

      {/* MetaMask Troubleshooting Section */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">MetaMask Troubleshooting</h2>
        <div className="space-y-6">
          {/* Wallet Not Connecting Issue */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-lg text-gray-700">MetaMask Wallet Not Connecting</h3>
            <p className="text-gray-600">
              If your MetaMask wallet is not connecting, try the following:
              <ul className="list-disc pl-5 mt-2">
                <li>Ensure MetaMask is installed in your browser or mobile app.</li>
                <li>Check that you are using the correct network in MetaMask (e.g., Ethereum Mainnet, Rinkeby Testnet).</li>
                <li>Make sure your MetaMask account is unlocked and connected to the app.</li>
                <li>Try refreshing the page or reconnecting your wallet by clicking the "Connect Wallet" button.</li>
                <li>If the issue persists, try clearing your browser's cache or reinstalling MetaMask.</li>
              </ul>
            </p>
          </div>

          {/* Network Issue */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-lg text-gray-700">MetaMask Network Not Found</h3>
            <p className="text-gray-600">
              If the network you're trying to connect to is not found:
              <ul className="list-disc pl-5 mt-2">
                <li>Check that you have selected the correct network in MetaMask.</li>
                <li>If using a testnet, make sure the testnet is supported by the application you're using.</li>
                <li>You may need to manually add the network to MetaMask through the "Custom RPC" option in MetaMask settings.</li>
              </ul>
            </p>
          </div>

          {/* MetaMask Installation */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-lg text-gray-700">MetaMask Installation Issues</h3>
            <p className="text-gray-600">
              If you are unable to install MetaMask:
              <ul className="list-disc pl-5 mt-2">
                <li>Visit the official MetaMask website (https://metamask.io) and download the extension or mobile app.</li>
                <li>If you encounter errors during installation, make sure you're using a supported browser (Chrome, Firefox, Brave, Edge).</li>
                <li>Ensure your browser version is up to date to avoid compatibility issues.</li>
              </ul>
            </p>
          </div>
        </div>
      </section>

      {/* Legal Documents Section */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Legal Documents</h2>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-semibold text-lg text-gray-700">Privacy Policy</h3>
            <p className="text-gray-600">
              At CryptGuard, your privacy is of utmost importance to us. This Privacy Policy outlines how we handle any information you share with us. We want to assure you that we do not collect or store any personally identifiable information, and your usage of our platform is entirely anonymous. Below is an overview of our practices:
            </p>
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold text-lg text-gray-700">1. Anonymous Usage</h4>
              <p className="text-gray-600">
                CryptGuard does not require any personal data to use our platform. You interact with our system through your MetaMask wallet, and no personal information is associated with your transactions.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">2. No Data Collection</h4>
              <p className="text-gray-600">
                We do not collect any personally identifiable information (PII) from you. The only information we interact with is the data related to your transactions, such as blockchain interactions and file hashes. Even this data does not contain any personal identifiers and is stored in a decentralized manner through IPFS and blockchain technology.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">3. Third-Party Services</h4>
              <p className="text-gray-600">
                CryptGuard may integrate third-party services, such as MetaMask, for wallet interactions. These services operate under their own privacy policies, and we encourage you to review their privacy terms. We do not have access to your MetaMask wallet keys, private keys, or any other private information.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">4. Data Security</h4>
              <p className="text-gray-600">
                CryptGuard handles file encryption and securely stores encryption keys on our servers. We ensure that your files are encrypted before being uploaded and stored on IPFS. Access to these files is controlled via the encryption key, which is securely managed by CryptGuard.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">5. No Sharing of Personal Information</h4>
              <p className="text-gray-600">
                As we do not collect or store personal data, there is no personal information to share with third parties. We do not sell, trade, or rent your personal information because we simply do not collect any.
              </p>
            </div>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-semibold text-lg text-gray-700">Terms of Service</h3>
            <p className="text-gray-600">
              These Terms of Service govern your use of CryptGuard. By using our platform, you agree to the following terms and conditions. Please read them carefully.
            </p>
            <div className="space-y-4 mt-4">
              <h4 className="font-semibold text-lg text-gray-700">1. Acceptance of Terms</h4>
              <p className="text-gray-600">
                By accessing or using CryptGuard, you agree to comply with these Terms of Service. If you do not agree with any of the terms, you must immediately cease using the platform.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">2. Anonymous Usage</h4>
              <p className="text-gray-600">
                CryptGuard does not require or collect any personally identifiable information. All transactions are anonymous, and users are responsible for managing their wallets and encryption keys.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">3. Use of the Platform</h4>
              <p className="text-gray-600">
                You agree to use CryptGuard only for lawful purposes and in accordance with our guidelines. You must not use the platform to store or transmit illegal or malicious content. CryptGuard is not responsible for any misuse of the platform by its users.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">4. Responsibility for Wallet Security</h4>
              <p className="text-gray-600">
                Users are solely responsible for the security of their wallets. CryptGuard does not have access to your MetaMask wallet or private keys. Ensure that you take appropriate steps to safeguard your wallet and keys.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">5. Intellectual Property</h4>
              <p className="text-gray-600">
                All content, features, and functionality of CryptGuard are the exclusive property of CryptGuard and are protected by intellectual property laws. Users are not permitted to copy, reproduce, or distribute any part of the platform without prior written consent.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">6. Limitation of Liability</h4>
              <p className="text-gray-600">
                CryptGuard is provided "as is" and "as available." We do not make any warranties or guarantees regarding the platform’s availability, reliability, or functionality. In no event shall CryptGuard be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of the platform.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">7. Modification of Terms</h4>
              <p className="text-gray-600">
                CryptGuard reserves the right to modify or update these Terms of Service at any time. You will be notified of significant changes through our platform, and your continued use of the platform constitutes your acceptance of the updated terms.
              </p>

              <h4 className="font-semibold text-lg text-gray-700">8. Governing Law</h4>
              <p className="text-gray-600">
                These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which CryptGuard operates. Any legal action or proceeding related to these terms shall be subject to the exclusive jurisdiction of the courts in that jurisdiction.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpSupport;
