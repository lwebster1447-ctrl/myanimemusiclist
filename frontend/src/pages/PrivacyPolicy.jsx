// frontend/src/pages/PrivacyPolicy.jsx
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Privacy Policy</h1>
        <p>Last updated: June 2026</p>
      </div>
      
      <div className="privacy-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2>1. Information We Collect</h2>
        <p>MyAnimeMusicList collects the following user data:</p>
        <ul>
          <li><strong>Email address</strong> - for authentication and account recovery</li>
          <li><strong>Username</strong> - for profile identification and display</li>
          <li><strong>Favorite songs list</strong> - user-generated content you choose to save</li>
          <li><strong>Profile picture</strong> - optional image you choose to upload</li>
          <li><strong>Bio</strong> - optional text you choose to add to your profile</li>
        </ul>
        
        <h2>2. How We Use Your Information</h2>
        <p>Your data is used solely to provide the core functionality of the app:</p>
        <ul>
          <li>Authenticating your account</li>
          <li>Displaying your saved songs and favorites</li>
          <li>Showing your profile to other users</li>
          <li>Allowing you to follow other users and be followed</li>
        </ul>
        
        <h2>3. Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>Firebase</strong> (Google) - for authentication, database, and hosting</li>
          <li><strong>Render</strong> - for hosting our backend API</li>
          <li><strong>Google AdSense</strong> - for displaying advertisements</li>
          <li><strong>AnimeThemes</strong> - for providing anime theme song data</li>
        </ul>
        
        <h2>4. Data Security</h2>
        <p>We take reasonable measures to protect your data using Firebase's built-in security rules and authentication. Your password is never stored in plain text.</p>
        
        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Request correction of your data</li>
          <li>Request deletion of your account and data</li>
          <li>Opt out of data collection (by not creating an account)</li>
        </ul>
        
        <h2>6. Cookies</h2>
        <p>We use essential cookies for authentication and session management. We do not use tracking cookies for analytics or advertising purposes without your explicit consent.</p>
        
        <h2>7. Children's Privacy</h2>
        <p>Our service does not knowingly collect data from children under 13. If you believe we have collected data from a child, please contact us.</p>
        
        <h2>8. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify users of any material changes via email or website notice.</p>
        
        <h2>9. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:lwebster1447@gmail.com">lwebster1447@gmail.com</a></li>
        </ul>
        
        <p style={{ marginTop: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
          This Privacy Policy applies to all users of MyAnimeMusicList.
        </p>
      </div>
    </div>
  );
}