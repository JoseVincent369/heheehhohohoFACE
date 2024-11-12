import React from 'react';

function Terms() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Terms and Conditions</h1>

      <h2>1. Purpose of Data Collection</h2>
      <p>
        As a part of our college project, we are collecting sensitive information
        that may include, but is not limited to, personal identification data, academic
        records, and contact details. This data will solely be used for research and 
        analysis relevant to the project’s goals.
      </p>

      <h2>2. Data Protection and Privacy</h2>
      <p>
        We are committed to protecting your privacy and personal information.
        All collected data will be securely stored and will not be shared with third
        parties unless explicitly authorized by you or as required by law. We employ 
        industry-standard security measures to safeguard your information.
      </p>

      <h2>3. Data Usage</h2>
      <p>
        Your data will be used strictly for educational purposes within the context of
        this project. Any findings will be presented in a way that ensures anonymity, 
        and individual identities will not be disclosed in any reports or publications.
      </p>

      <h2>4. User Rights</h2>
      <p>
        You have the right to:
        <ul>
          <li>Access the data we have collected from you</li>
          <li>Request corrections to any inaccuracies</li>
          <li>Withdraw your consent and request data deletion at any time, resulting in 
          the removal of your personal information from our records.</li>
        </ul>
      </p>

      <h2>5. Data Retention</h2>
      <p>
        Collected data will be retained only for the duration of the project.
        Once the project concludes, all personal and sensitive information will be 
        permanently deleted.
      </p>

      <h2>6. Amendments</h2>
      <p>
        We reserve the right to make changes to these terms. Should any changes 
        occur, users will be notified, and continued participation will imply acceptance 
        of the modified terms.
      </p>

      <p>By using our service, you acknowledge that you have read and understood these terms and agree to the collection and use of your information as described.</p>
    </div>
  );
}

export default Terms;
